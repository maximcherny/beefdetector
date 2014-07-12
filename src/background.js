// Copyright (c) 2014 Maxim Chernyshev. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Global variables
var fp;
var bgPort;
var selectedId = null;
var state = {};

$.ajax({
	type: 'GET',
	url: chrome.extension.getURL('beef.json'),
	dataType: 'json',
	success: function(data) {
		fp = data;
	},
	async: false
});

var popup = window.open(
	chrome.extension.getURL('popup.html'),
	'beef-detector-popup',
	'width=640,height=480'
);

console.log(popup);

chrome.runtime.onConnect.addListener(function(port) {
	if (port.name == 'bg') {
		bgPort = port;
		chrome.tabs.query({}, function(tabs) {
			for (var i = 0; i < tabs.length; i++) {
				bgPort.postMessage({
					action: 'tabCreated',
					tab: tabs[i]
				});
			}
		});
		return;
	} else if (port.name != 'content') {
		return;
	}
	port.onMessage.addListener(function(msg, sender) {
		var tabId = sender.sender.tab.id;
		switch (msg.action) {
			case 'propertyAccess':
				if (typeof state[tabId] == 'undefined') {
					state[tabId] = {
						props: {},
						total: 0
					};
					Object.observe(state[tabId].props, function(changes) {
						changes.forEach(function(change) {
							if (change.type == 'update' && bgPort) {
								bgPort.postMessage({
									action: 'propertyAccess',
									tabId: tabId,
									state: state[tabId]
								});
							}
							//console.log(change.type, change.name, change.oldValue);
						});
					});
				}
				if (typeof state[tabId].props[msg.prop] == 'undefined') {
					state[tabId].props[msg.prop] = 0;
				}
				state[tabId].props[msg.prop]++;
				state[tabId].total++;
				break;
			case 'newGlobalVar':
				var ast = new ASTFingerprint(msg.data);
				var tmp = ast.getMethodFingerprints();
				break;
		}
	});
});

chrome.tabs.onCreated.addListener(function(tab) {
	bgPort.postMessage({
		action: 'tabCreated',
		tab: tab
	});
});

chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
	bgPort.postMessage({
		action: 'tabUpdated',
		tab: tab,
		change: change
	});
	if (change.status == 'complete' && typeof state[tabId] != 'undefined') {
		bgPort.postMessage({
			action: 'propertyAccess',
			tabId: tabId,
			state: state[tabId]
		});
	}
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	bgPort.postMessage({
		action: 'tabRemoved',
		tabId: tabId
	});
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
	selectedId = activeInfo.tabId;
});
