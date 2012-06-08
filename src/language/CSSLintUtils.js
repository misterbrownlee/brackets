/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, JSLINT, PathUtils */

/**
 * Allows JSLint to run on the current document and report results in a UI panel.
 *
 */

define(function (require, exports, module) {
    'use strict';
    
    require("thirdparty/csslint/release/csslint");
    
    var DocumentManager     = require("document/DocumentManager"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        EditorManager           = require("editor/EditorManager");
   
    /**
     * @private
     * @type {PreferenceStorage}
     */
    var _prefs = null;
    
    /**
     * @private
     * @type {boolean}
     */
    var _enabled = true;
    
    /**
     * @return {boolean} Enabled state of JSLint.
     */
    function getEnabled() {
        return _enabled;
    }
    
        
    function _shouldParse(fileExtension) {
        
         //return /^(\.js|\.htm|\.html)$/i.test(ext));
        return (/^(\.css|\.less)$/i.test(fileExtension));
    }
    
    
    function run() {
        
        var currentDocument = DocumentManager.getCurrentDocument();
        
        var perfTimerDOM,
            perfTimerLint;

        var extension = currentDocument ? PathUtils.filenameExtension(currentDocument.file.fullPath) : "";
        
        var $lintResults = $("#csslint-results");
        var $goldStar = $("#gold-star");
        
        if (getEnabled() && _shouldParse(extension)) {
            //alert("current doc is " + extension);
            
            var text = currentDocument.getText();
            
            var result = CSSLint.verify(text);
            
            var $errorTable = $("<table class='zebra-striped condensed-table'>").append("<tbody>");
            var $selectedRow;
            
            result.messages.forEach(function (message, i) {
                var output = "found " + message + " (line " + message.line + ", col " + message.col + ")" + message.type;
                
                var makeCell = function (content) {
                    return $("<td/>").text(content);
                };
            
                // Add row to error table
                var $row = $("<tr/>")
                    .append(makeCell(message.line))
                    .append(makeCell(message.col))
                    .append(makeCell(message.message))
                    .append(makeCell(message.type))
                    .appendTo($errorTable);
                
                $row.click(function () {
                    if ($selectedRow) {
                        $selectedRow.removeClass("selected");
                    }
                    $row.addClass("selected");
                    $selectedRow = $row;
     
                    var editor = EditorManager.getCurrentFullEditor();
                    editor.setCursorPos(message.line - 1, message.character - 1);
                    EditorManager.focusEditor();
                });
            });
            
            $("#csslint-results .table-container")
                    .empty()
                    .append($errorTable);
            $lintResults.show();
            $goldStar.hide();
            
            // close the error window if disabled or wrong file type
        } else {
            $lintResults.hide();
            $goldStar.show();
        }
        
    
 
    }
    
    
    /**
     * @private
     * Update DocumentManager listeners.
     */
    function _updateListeners() {
        if (_enabled) {
            // register our event listeners
            $(DocumentManager)
                .on("currentDocumentChange.csslint", function () {
                    run();
                })
                .on("documentSaved.csslint", function (event, document) {
                    if (document === DocumentManager.getCurrentDocument()) {
                        run();
                    }
                });
        } else {
            $(DocumentManager).off(".csslint");
        }
    }
    
        
    function _setEnabled(enabled) {
        _enabled = enabled;
        _updateListeners();
        _prefs.setValue("enabled", _enabled);
    
        // run immediately
        run();
    }
    
        
    /**
     * Enable or disable JSLint.
     * @param {boolean} enabled Enabled state.
     */
    function setEnabled(enabled) {
        if (_enabled !== enabled) {
            _setEnabled(enabled);
        }
    }
    
    
    // Init PreferenceStorage
    _prefs = PreferencesManager.getPreferenceStorage(module.id, { enabled: true });
    _setEnabled(_prefs.getValue("enabled"));
    
    // Define public API
    exports.run = run;
    exports.getEnabled = getEnabled;
    exports.setEnabled = setEnabled;
    
});
  