
// Global vars
var $open;
var $closed;

// Helper functions
function attachTabPanelEvents($panel) {
	var $tmp = $(document.createElement('div')).append($panel);
	// $('li:has(ul)', $tmp).addClass('parent_li').find(' > span').attr('title', 'Collapse this branch');
	$('li:has(ul)', $tmp).addClass('parent_li');
	$('li.parent_li > span', $tmp).on('click', function(e) {
		var children = $(this).parent('li.parent_li').find(' > ul > li');
		if (children.is(":visible")) {
			children.hide('fast');
			$(this).attr('title', 'Expand this branch').find(' > i').addClass('icon-plus-sign').removeClass('icon-minus-sign');
		} else {
			children.show('fast');
			$(this).attr('title', 'Collapse this branch').find(' > i').addClass('icon-minus-sign').removeClass('icon-plus-sign');
		}
		e.stopPropagation();
	});
	return $tmp.first();
}

function renderTabPanel(tab) {
	var $panel = $(document.createElement('li')).attr('id', 'tab-' + tab.id).text(' ');
	$('<span class="label label-info"><i class="icon-folder-open"></i> ' + ' [' + tab.id + ']' + '</span>').prependTo($panel);
	$(document.createElement('a')).attr('href', '#').text(tab.url).appendTo($panel);

	var $node1 = $(document.createElement('ul'));
	var $leaf1 = $(document.createElement('li')).appendTo($node1);
	$('<span class="label group-label"><i class="icon-plus-sign"></i> Fingerprinting</span><span class="badge badge-success">0</span>').appendTo($leaf1);

	var $node11 = $(document.createElement('ul'));
	var $leaf11 = $(document.createElement('li')).appendTo($node11).hide();
	$('<span><i class="icon-eye-open"></i> Details <pre></pre></span>').appendTo($leaf11);

	var $node2 = $(document.createElement('ul'));
	var $leaf2 = $(document.createElement('li')).appendTo($node2);
	$('<span class="label group-label"><i class="icon-plus-sign"></i> BeEF Object Match</span><span class="badge badge-success">0</span>').appendTo($leaf2);

	var $node21 = $(document.createElement('ul'));
	var $leaf21 = $(document.createElement('li')).appendTo($node21).hide();
	$('<span><i class="icon-eye-open"></i> Details <pre></pre></span>').appendTo($leaf21);

	var $node3 = $(document.createElement('ul'));
	var $leaf3 = $(document.createElement('li')).appendTo($node3);
	$('<span class="label group-label"><i class="icon-plus-sign"></i> WebSocket Traffic</span><span class="badge badge-success">0</span>').appendTo($leaf3);

	var $node31 = $(document.createElement('ul'));
	var $leaf31 = $(document.createElement('li')).appendTo($node31).hide();
	$('<span><i class="icon-eye-open"></i> Details <pre></pre></span>').appendTo($leaf31);

	$node11.appendTo($leaf1);
	$node1.appendTo($panel);

	$node21.appendTo($leaf2);
	$node2.appendTo($panel);

	$node31.appendTo($leaf3);
	$node3.appendTo($panel);

	attachTabPanelEvents($panel);

	return $panel;
}

function onTabCreated(tab) {
	$open.append(renderTabPanel(tab));
}

function onTabUpdated(tab, change) {
	var url = tab.url;
	if (typeof change.url != 'undefined') url = change.url;
	$('#tab-' + tab.id).find('a:eq(0)').text(url);
}

function onTabRemoved(tabId) {
	$('#tab-' + tabId).prependTo($closed);
}

function onPropertyAccess(tabId, state) {
	var $node = $('#tab-' + tabId + ' li:eq(0)');
	var $count = $node.find('span:eq(1)');
	if (state.total > 2000) {
		$count.removeClass('badge-success').addClass('badge-warning');
	}
	$count.text(state.total);
	$node.find('pre:eq(0)').text(JSON.stringify(state.props, undefined, 2));
}

function onNewGlobalVar(tabId, state) {
	var $node = $('#tab-' + tabId + '> ul:eq(1) > li:eq(0)');
	var $count = $node.find('span:eq(1)');
	if (state.maxMatch == 1) {
		$count.removeClass('badge-success').addClass('badge-important');
	}
	$count.text(state.maxMatch);
	$node.find('pre:eq(0)').text(JSON.stringify(state.objects, undefined, 2));
}

function onWebSocket(tabId, state) {
	var $node = $('#tab-' + tabId + '> ul:eq(2) > li:eq(0)');
	var $count = $node.find('span:eq(1)');
	if (state.heartbeat) {
		$count.removeClass('badge-success').addClass('badge-warning');
	}
	if (state.jsPayload) {
		$count.removeClass('badge-success').removeClass('badge-warning').addClass('badge-important');
	}
	$count.text(state.count);
	$node.find('pre:eq(0)').text(JSON.stringify(state.urls, undefined, 2));
}

$(function() {
	$open = $('#open-tabs ul:first');
	$closed = $('#closed-tabs ul:first');

	// Subscribe to port messages
	var port = chrome.runtime.connect({ name: 'bg' });
	port.onMessage.addListener(function(msg) {
		if (msg.action == 'undefined') {
			return;
		}
		switch (msg.action) {
			// Tab events
			case 'tabCreated':
				onTabCreated(msg.tab);
				break;
			case 'tabUpdated':
				onTabUpdated(msg.tab, msg.change);
				break;
			case 'tabRemoved':
				onTabRemoved(msg.tabId);
				break;
			// Fingerprinting activity
			case 'propertyAccess':
				onPropertyAccess(msg.tabId, msg.state);
				break;
			// Analysis of global objects
			case 'newGlobalVar':
				onNewGlobalVar(msg.tabId, msg.state);
				break;
			// WebSocket traffic
			case 'webSocket':
				onWebSocket(msg.tabId, msg.state);
				break;
		}
		// console.log(msg);
	});
});
