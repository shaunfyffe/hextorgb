'use strict';

angular.module('hexRgbApp', ['ngAnimate', 'ui.bootstrap', 'ui.router'])
    .config(function($stateProvider, $urlRouterProvider, $locationProvider) {

        $stateProvider
            .state('color', {
                url: '/:colorHex',
                controller: 'colorController',
                controllerAs: 'colorCtrl',
                reloadOnSearch: false
            });
        $urlRouterProvider.otherwise('/');
        $locationProvider.html5Mode(true);
    })
    .controller('colorController', ['$http', '$stateParams', '$state', function($http, $stateParams, $state) {
        var colorCtrl = this;
        colorCtrl.hexValue = $stateParams.colorHex;
        colorCtrl.tints = [];
        colorCtrl.shades = [];
        colorCtrl.colorArray = [];
        colorCtrl.colorHistory = [];

        colorCtrl.convertToRgb = function(hex) {
            hex = hex.replace(/[^0-9A-F]/gi, '');
            if (hex.length < 3 || (hex.length > 3 && hex.length < 6)) {
                colorCtrl.bgCol = '';
                colorCtrl.rgbVal = '';
                if (hex.length > 3) {
                    setTintShade(hex.length);
                }
                completeColor(hex);
                $state.go('color', {colorHex: colorCtrl.bgCol}, {notify: false});
                return;
            }
            if (hex.length > 6) {
                hex = hex.substr(0,6);
            }
            if (hex.length == 3) {
                colorCtrl.bgCol = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                setRgb();
            }
            if (hex.length == 6) {
                colorCtrl.bgCol = hex;
                setRgb();
            }
            colorCtrl.hexValue = '#' + hex;
        };

        colorCtrl.convertToHex = function(col) {
            colorCtrl.bgCol = '';
            $state.go('color', {colorHex: colorCtrl.bgCol}, {notify: false});
            if (col == '') {
                colorCtrl.rgbVal = '';
                colorCtrl.hexValue = '';
                return;
            }
            var colors = col.split(',');
            for (var i = 0; i < colors.length; i++) {
                colors[i] = colors[i].replace(/[^0-9]/gi, '');
            }
            if (colors.length != 3) {
                resetHex();
            } else if (colors[0] == '' || colors[1] == '' || colors[2] == '') {
                resetHex();
            } else if ((colors[0] < 0 || colors[0] > 255) || (colors[1] < 0 || colors[1] > 255) || (colors[2] < 0 || colors[2] > 255)) {
                resetHex();
            } else {
                colorCtrl.bgCol = ((1 << 24) + (parseInt(colors[0]) << 16) + (parseInt(colors[1]) << 8) + parseInt(colors[2])).toString(16).substr(1);
                colorCtrl.hexValue = '#' + colorCtrl.bgCol;
                setTintShade(colorCtrl.bgCol.length);
                setNoTintOrShade(colors[0], colors[1], colors[2]);
                $state.go('color', {colorHex: colorCtrl.bgCol}, {notify: false});
            }
        };

        colorCtrl.remove = function(arr, index) {
            arr.splice(index,1);
        };

        colorCtrl.addToHistory = function() {
            if (colorCtrl.bgCol != '') {
                if (colorCtrl.colorHistory.length === 12) {
                    removeColor();
                }
                colorCtrl.colorHistory.unshift('#' + colorCtrl.bgCol);
            }
        };

        colorCtrl.getRandColor = function() {
            colorCtrl.convertToRgb(findRandColor());
        };

        colorCtrl.updateRgb = function(rgbCol) {
            var rgbValues = rgbCol.split(',');
            for (var i = 0; i < rgbValues.length; i++) {
                rgbValues[i] = rgbValues[i].replace(/[^0-9]/gi, '');
            }
            if (rgbValues.length === 3 && (rgbValues[0] >= 0 && rgbValues[0] <= 255) && (rgbValues[1] >= 0
                && rgbValues[1] <= 255) && (rgbValues[2] >= 0 && rgbValues[2] <= 255)) {
                colorCtrl.rgbVal = "rgb("+[rgbValues[0], rgbValues[1], rgbValues[2]].join()+")";
            }
        };

        var shadeCol = function (color, percent) {
            var f=parseInt(color.slice(1),16);
            var t=percent<0?0:255;
            var p=percent<0?percent*-1:percent;
            var R=f>>16;
            var G=f>>8&0x00FF;
            var B=f&0x0000FF;
            return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
        };

        var setTintShade = function(length) {
            var tintPercent = [.083, .167, .25, .333, .417, .50, .583, .667, .75, .833, .917, 1.0];
            var shadePercent = [-.083, -.167, -.25, -.333, -.417, -.50, -.583, -.667, -.75, -.833, -.917, -1.0];

            if (length == 6) {
                for (var i = 0; i < 12; i++) {
                    colorCtrl.tints[i] = shadeCol('#' + colorCtrl.bgCol, tintPercent[i]);
                    colorCtrl.shades[i] = shadeCol('#' + colorCtrl.bgCol, shadePercent[i]);
                }
            } else {
                for (var i = 0; i < 12; i++) {
                    colorCtrl.tints[i] = colorCtrl.bgCol;
                    colorCtrl.shades[i] = colorCtrl.bgCol;
                }
            }
        };

        var setNoTintOrShade = function(r, g, b) {
            if (r > 253 && g > 253 && b > 253) {
                colorCtrl.tints[0] = "All tints are identical to #" + colorCtrl.bgCol;
                colorCtrl.tints.splice(1);
            }
            if (r < 3 && g < 3 && b < 3) {
                colorCtrl.shades[0] = "All shades are identical to #" + colorCtrl.bgCol;
                colorCtrl.shades.splice(1);
            }
        };

        var findRandColor = function() {
            var r = Math.floor(Math.random()*255+1);
            var g = Math.floor(Math.random()*255+1);
            var b = Math.floor(Math.random()*255+1);
            return ((1 << 24) + (parseInt(r) << 16) + (parseInt(g) << 8) + parseInt(b)).toString(16).substr(1);
        };

        var completeColor = function(hex) {
            if (hex.length === 0) {
                for (var i = 0; i < 48; i++) {
                    colorCtrl.colorArray[i] = '#' + findRandColor();
                }
            } else if (hex.length === 5) {
                colorCtrl.colorArray = [];
                for (var j = 0; j < 16; j++) {
                    colorCtrl.colorArray[j] = '#' + hex + j.toString(16);
                }
            } else {
                for (var i = 0; i < 48; i++) {
                    colorCtrl.colorArray[i] = '#' + hex + findRandColor().substr(hex.length);
                }
            }
        };

        var removeColor = function() {
            colorCtrl.colorHistory.pop();
        };

        var resetHex = function() {
            colorCtrl.bgCol = '';
            colorCtrl.hexValue = '';
            setTintShade(colorCtrl.bgCol.length);
        };

        var setRgb = function() {
            var rgb = parseInt(colorCtrl.bgCol, 16);
            var red = (rgb >> 16) & 0xFF;
            var green = (rgb >> 8) & 0xFF;
            var blue = rgb & 0xFF;
            colorCtrl.rgbVal = "rgb(" + [red, blue, green].join() + ")";
            setTintShade(colorCtrl.bgCol.length);
            setNoTintOrShade(red, green, blue);
            $state.go('color', {colorHex: colorCtrl.bgCol}, {notify: false});
        };
    }]);