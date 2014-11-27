// Copyright (c) 2014 Maxim Chernyshev. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Global variables
var bgPort;
var selectedId = null;
var state = {};

// Processing worker pools
var pool = new WorkerPool('worker.js', 8);
pool.registerOnMessage(function(e) {
	switch (e.data.action) {
		case 'newGlobalVar':
			state[e.data.tabId].objects.objects[e.data.prop] = e.data.match;
			if (state[e.data.tabId].objects.maxMatch < e.data.match) {
				state[e.data.tabId].objects.maxMatch = e.data.match;
			}
			break;
		case 'webSocket':
			state[e.data.tabId].ws = e.data.state;
			if (bgPort) {
				bgPort.postMessage({
					action: e.data.action,
					tabId: e.data.tabId,
					state: state[e.data.tabId].ws
				});
			}
			break;
	}

	// TODO: refactor into the most approriate place
	if (!state[e.data.tabId].notified && state[e.data.tabId].objects.maxMatch == 1) {
		chrome.notifications.create('', {
			type: 'basic',
			iconUrl: 'icon.png',
			title: 'BeEF Alert',
			message: 'Hook signature detected',
			priority: 2
		}, function(id) {
			//
		});
		state[e.data.tabId].notified = true;
	}
});

// Popup info window
var popup = window.open(
	chrome.extension.getURL('popup.html'),
	'beef-detector-popup',
	'width=480,height=' + screen.height
);

console.log(popup);

function initTabState(tabId) {
	state[tabId] = {
		notified: false,
		props: {
			props: {},
			total: 0
		},
		objects: {
			objects: {},
			maxMatch: 0
		},
		ws: {
			urls: {},
			count: 0,
			heartbeat: false,
			jsPayload: false
		}
	};
	// Dynamically observe for value changes
	Object.observe(state[tabId].props.props, function(changes) {
		changes.forEach(function(change) {
			if (change.type == 'update' && bgPort) {
				bgPort.postMessage({
					action: 'propertyAccess',
					tabId: tabId,
					state: state[tabId].props
				});
			}
		});
	});
	Object.observe(state[tabId].objects.objects, function(changes) {
		changes.forEach(function(change) {
			if (change.type == 'add' && bgPort) {
				bgPort.postMessage({
					action: 'newGlobalVar',
					tabId: tabId,
					state: state[tabId].objects
				});
			}
		});
	});
}

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
			case 'contentInit':
				initTabState(tabId);
				break;
			case 'propertyAccess':
				if (typeof state[tabId].props.props[msg.prop] == 'undefined') {
					state[tabId].props.props[msg.prop] = 0;
				}
				state[tabId].props.props[msg.prop]++;
				state[tabId].props.total++;
				break;
			case 'newGlobalVar':
				pool.postMessage({
					tabId: tabId,
					msg: msg
				});
				break;
			case 'webSocket':
				pool.postMessage({
					tabId: tabId,
					msg: msg,
					state: state[tabId].ws
				});
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
