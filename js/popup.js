// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


function click(e) {
  chrome.tabs.executeScript(null,
      {code: "alert(document.cookie)"});
  window.close();
}

document.addEventListener('DOMContentLoaded', function () {
  var button = document.querySelectorAll('button');
  for (var i = 0; i < button.length; i++) {
    button[i].addEventListener('click', click);
  }
});
