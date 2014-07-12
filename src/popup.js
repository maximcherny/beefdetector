// Copyright (c) 2014 Maxim Chernyshev. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Global vars
var $open;
var $closed;

// Helper functions
function attachTabPanelEvents($panel) {
	var $tmp = $(document.createElement('div')).append($panel);
	$('li:has(ul)', $tmp).addClass('parent_li').find(' > span').attr('title', 'Collapse this branch');
	$('li.parent_li > span', $tmp).on('click', function (e) {
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
	$('<span><i class="icon-folder-open"></i> ' + ' [' + tab.id + ']' + '</span>').prependTo($panel);
	$(document.createElement('a')).attr('href', '#').text(tab.url).appendTo($panel);

	var $node1 = $(document.createElement('ul'));
	var $leaf1 = $(document.createElement('li')).appendTo($node1);
	$('<span><i class="icon-minus-sign"></i> Fingerptints</span><span>0</span>').appendTo($leaf1);

	var $node11 = $(document.createElement('ul'));
	var $leaf11 = $(document.createElement('li')).appendTo($node11);
	$('<span><i class="icon-eye-open"></i> Attribute Breakdown <pre></pre></span>').appendTo($leaf11);

	$node11.appendTo($leaf1);
	$node1.appendTo($panel);
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
	$node.find('span:eq(1)').text(state.total);
	$node.find('pre:eq(0)').text(JSON.stringify(state.props, undefined, 2));
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
		}
		// console.log(msg);
	});
});
