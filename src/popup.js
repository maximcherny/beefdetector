// Copyright (c) 2014 Maxim Chernyshev. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Global vars
var $open;
var $closed;

// Helper functions
function onTabCreated(tab) {
	var $el = $(document.createElement('li'))
		.attr('id', 'tab-' + tab.id)
		.text('[' + tab.id + '] ' + tab.url)
		.appendTo($open);
}

function onTabUpdated(tab, change) {
	var url = tab.url;
	if (typeof change.url != 'undefined') url = change.url;
	$('#tab-' + tab.id).text('[' + tab.id + '] ' + url);
}

function onTabRemoved(tabId) {
	$('#tab-' + tabId).prependTo($closed);
}

function onPropertyAccess(tabId, state) {
	var $el = $('#tab-' + tabId);
	var $span = $el.find('span').first();
	if ($span.length == 0) {
		$span = $(document.createElement('span')).appendTo($el);
	}
	$span.text(JSON.stringify(state));
}

$(function() {
	$open = $('#open-tabs');
	$closed = $('#closed-tabs');

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
