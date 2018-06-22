/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/angularjs/angular-route.d.ts" />
/// <reference path="../typings/ngstorage/ngstorage.d.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var module = angular.module("rpcalc", ["ngRoute", "ngStorage"]);
module.config(["$routeProvider", function ($routeProvider) {
        $routeProvider
            .when("/workbook", { templateUrl: "Views/workbook.html", controller: RPCalculator.Workbook.Controller, controllerAs: "$ctrl" })
            .when("/worksheets/:index", { templateUrl: "Views/worksheet.html", controller: RPCalculator.Scoring.Controller, controllerAs: "$ctrl" })
            .when("/judges/:index", { templateUrl: "Views/editor.html", controller: RPCalculator.Judges.Controller, controllerAs: "$ctrl" })
            .when("/competitors/:index", { templateUrl: "Views/editor.html", controller: RPCalculator.Competitors.Controller, controllerAs: "$ctrl" })
            .otherwise({ redirectTo: "/workbook" })
            .caseInsensitiveMatch = true;
    }]);
module.run(["$rootScope", function ($rootScope) {
        $rootScope.textPattern = RPCalculator.textPattern;
        $rootScope.numberPattern = RPCalculator.numberPattern;
        $rootScope.vclass = function (controller, classIfValid, classIfInvalid) {
            if (classIfValid === void 0) { classIfValid = 'is-valid'; }
            if (classIfInvalid === void 0) { classIfInvalid = 'is-invalid'; }
            var output = {};
            if (classIfValid !== null)
                Object.defineProperty(output, classIfValid, { get: function () { return controller.$valid; }, enumerable: true });
            if (classIfInvalid !== null)
                Object.defineProperty(output, classIfInvalid, { get: function () { return controller.$invalid; }, enumerable: true });
            return output;
        };
    }]);
var RPCalculator;
(function (RPCalculator) {
    "use strict";
    RPCalculator.maxJudges = 7;
    RPCalculator.maxCompetitors = 8;
    RPCalculator.textPattern = "(^[\\w\\s-]+$)";
    RPCalculator.numberPattern = "(^\\d+$)";
    RPCalculator.defaultWorkbookTitle = "Untitled Workbook";
    RPCalculator.defaultWorksheetTitle = "Untitled Worksheet";
    function isBlank(value) {
        if (angular.isUndefined(value))
            return true;
        if (value === null)
            return true;
        if (angular.isArray(value))
            return value.length === 0;
        if (angular.isObject(value))
            return angular.toJson(value) === angular.toJson({});
        if (String(value).trim() === "")
            return true;
        if (value === NaN)
            return true;
        return false;
    }
    RPCalculator.isBlank = isBlank;
    function ifBlank(value, defaultValue) { return (isBlank(value)) ? defaultValue : value; }
    RPCalculator.ifBlank = ifBlank;
    function swap(array, index1, index2) {
        var temp = array[index1];
        array[index1] = array[index2];
        array[index2] = temp;
    }
    RPCalculator.swap = swap;
    function swapUp(array, index) { swap(array, index, index - 1); }
    RPCalculator.swapUp = swapUp;
    function swapDown(array, index) { swap(array, index, index + 1); }
    RPCalculator.swapDown = swapDown;
    function toInt(value) {
        var regExp = new RegExp(RPCalculator.numberPattern);
        if (!regExp.test(value))
            return;
        return parseInt(regExp.exec(value)[1], 10);
    }
    RPCalculator.toInt = toInt;
})(RPCalculator || (RPCalculator = {}));
(function (RPCalculator) {
    "use strict";
    var Menu;
    (function (Menu) {
        var Controller = /** @class */ (function () {
            function Controller($workbook, $location, $window) {
                this.$workbook = $workbook;
                this.$location = $location;
                this.$window = $window;
                this._collapsed = true;
            }
            Object.defineProperty(Controller.prototype, "collapsed", {
                get: function () { return this._collapsed; },
                enumerable: true,
                configurable: true
            });
            Controller.prototype.toggle = function ($event, state) {
                if ($event) {
                    $event.preventDefault();
                    event.stopPropagation();
                }
                this._collapsed = RPCalculator.ifBlank(state, !this._collapsed);
            };
            Controller.prototype.go = function (path, $event) { this.toggle($event); this.$location.path(path); };
            Controller.prototype.download = function ($event) {
                this.toggle($event, true);
                var link = document.createElement("a");
                link.href = "data:text/json;charset=utf-8, " + encodeURIComponent(angular.toJson(this.$workbook.workbook, false));
                link.download = RPCalculator.ifBlank(this.$workbook.workbook.title, RPCalculator.defaultWorkbookTitle) + ".json";
                link.click();
            };
            Controller.prototype.upload = function ($event) {
                this.toggle($event, true);
                var input = document.getElementById("upload");
                input.click();
            };
            Controller.prototype.example = function ($event) {
                var _this = this;
                this.toggle($event, true);
                if (!this.$window.confirm("The current workbook will be overwritten. Are you sure you want to continue?"))
                    return;
                this.$workbook.loadExample().then(function () { _this.$location.path("/workbook"); });
            };
            Controller.prototype.$postLink = function () { };
            Controller.$inject = ["$workbook", "$location", "$window"];
            return Controller;
        }());
        Menu.Controller = Controller;
    })(Menu = RPCalculator.Menu || (RPCalculator.Menu = {}));
    var Workbook;
    (function (Workbook) {
        var Service = /** @class */ (function () {
            function Service($localStorage, $location, $http, $q) {
                this.$localStorage = $localStorage;
                this.$location = $location;
                this.$http = $http;
                this.$q = $q;
                if (angular.isUndefined($localStorage.workbook))
                    this.loadExample();
            }
            Service.prototype.go = function (path, index) {
                if (path === void 0) { path = "/workbook"; }
                if (index >= 0)
                    path += "/" + index;
                this.$location.path(path);
            };
            Service.prototype.loadExample = function () {
                var _this = this;
                return this.$http.get("example.json").then(function (response) {
                    _this.$localStorage.workbook = response.data;
                });
            };
            Object.defineProperty(Service.prototype, "workbook", {
                get: function () {
                    return RPCalculator.ifBlank(this.$localStorage.workbook, { title: null, worksheets: [] });
                },
                set: function (workbook) { this.$localStorage.workbook = workbook; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Service.prototype, "title", {
                get: function () {
                    if (angular.isUndefined(this.workbook.title))
                        this.workbook.title = "New Workbook";
                    return this.workbook.title;
                },
                set: function (title) { this.workbook.title = title; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Service.prototype, "worksheets", {
                get: function () {
                    if (!angular.isArray(this.workbook.worksheets))
                        this.workbook.worksheets = [];
                    return this.workbook.worksheets;
                },
                enumerable: true,
                configurable: true
            });
            Service.prototype.validateJudges = function (judges) { return RPCalculator.isBlank(this.judgesValidationError(judges)); };
            Service.prototype.judgesValidationError = function (judges) {
                if (RPCalculator.isBlank(judges) || !angular.isArray(judges) || judges.length < 3)
                    return "There must be at least 3 judges";
                if (judges.length > RPCalculator.maxJudges)
                    return "There cannot be more than " + RPCalculator.maxJudges + " judges";
                if (judges.length % 2 === 0)
                    return "There must be an odd number of judges";
                var names = [];
                for (var i = 0; i < judges.length; i++) {
                    if (RPCalculator.isBlank(judges[i]) || RPCalculator.isBlank(judges[i].name))
                        return "Each judge must have a name";
                    if (names.indexOf(judges[i].name) >= 0)
                        return "Each judge must have a unique name";
                    names.push(judges[i].name);
                }
                return;
            };
            Service.prototype.competitorsValidationError = function (competitors) {
                if (RPCalculator.isBlank(competitors) || !angular.isArray(competitors) || competitors.length < 2)
                    return "There must be at least 2 competitors";
                if (competitors.length > RPCalculator.maxCompetitors)
                    return "There cannot be more than " + RPCalculator.maxCompetitors + " competitors";
                var ids = [], names = [];
                for (var i = 0; i < competitors.length; i++) {
                    if (RPCalculator.isBlank(competitors[i]) || RPCalculator.isBlank(competitors[i].id))
                        return "Each competitor must have a number";
                    if (ids.indexOf(competitors[i].id) >= 0)
                        return "Each competitor must have a unique number";
                    if (RPCalculator.isBlank(competitors[i].name))
                        return "Each competitor must have a name";
                    if (names.indexOf(competitors[i].name) >= 0)
                        return "Each competitor must have a unique name";
                    ids.push(competitors[i].id);
                    names.push(competitors[i].name);
                }
                return;
            };
            Service.prototype.validateCompetitors = function (competitors) { return RPCalculator.isBlank(this.competitorsValidationError(competitors)); };
            Service.$inject = ["$localStorage", "$location", "$http", "$q"];
            return Service;
        }());
        Workbook.Service = Service;
        var Controller = /** @class */ (function () {
            function Controller($workbook, $window) {
                this.$workbook = $workbook;
                this.$window = $window;
            }
            Object.defineProperty(Controller.prototype, "defaultWorkbookTitle", {
                get: function () { return RPCalculator.defaultWorkbookTitle; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "defaultWorksheetTitle", {
                get: function () { return RPCalculator.defaultWorksheetTitle; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "title", {
                get: function () { return this.$workbook.title; },
                set: function (title) { this.$workbook.title = title; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "worksheets", {
                get: function () { return this.$workbook.worksheets; },
                enumerable: true,
                configurable: true
            });
            Controller.prototype.add = function () { this.worksheets.push({ title: null, judges: [], competitors: [] }); };
            Controller.prototype.remove = function (index) {
                if (!this.$window.confirm("Are you sure you want to delete this worksheet?"))
                    return;
                this.worksheets.splice(index, 1);
            };
            Controller.prototype.moveUp = function (index) { RPCalculator.swapUp(this.worksheets, index); };
            Controller.prototype.moveDown = function (index) { RPCalculator.swapDown(this.worksheets, index); };
            Controller.prototype.copy = function (index) {
                var copy = angular.copy(this.worksheets[index]);
                copy.title = RPCalculator.ifBlank(copy.title, RPCalculator.defaultWorksheetTitle) + " (Copy)";
                this.worksheets.push(copy);
                RPCalculator.swap(this.worksheets, this.worksheets.indexOf(copy), index + 1);
            };
            Controller.$inject = ["$workbook", "$window"];
            return Controller;
        }());
        Workbook.Controller = Controller;
    })(Workbook = RPCalculator.Workbook || (RPCalculator.Workbook = {}));
    var Worksheet;
    (function (Worksheet) {
        var Controller = /** @class */ (function () {
            function Controller($scope, $workbook, $route, $routeParams, $window, $filter) {
                this.$scope = $scope;
                this.$workbook = $workbook;
                this.$route = $route;
                this.$routeParams = $routeParams;
                this.$window = $window;
                this.$filter = $filter;
                if (angular.isUndefined(this.index) || angular.isUndefined(this.$workbook.worksheets[this.index]))
                    this.$workbook.go();
            }
            Object.defineProperty(Controller.prototype, "form", {
                get: function () { return this.$scope["form"]; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "index", {
                get: function () { return RPCalculator.toInt(this.$routeParams["index"]); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "title", {
                get: function () { return RPCalculator.ifBlank(this.worksheet.title, RPCalculator.defaultWorksheetTitle); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "worksheet", {
                get: function () { return this.$workbook.worksheets[this.index]; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "judges", {
                get: function () { return RPCalculator.ifBlank(this.worksheet.judges, []); },
                set: function (judges) { this.worksheet.judges = angular.copy(RPCalculator.ifBlank(judges, [])); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "competitors", {
                get: function () { return RPCalculator.ifBlank(this.worksheet.competitors, []); },
                set: function (competitors) { this.worksheet.competitors = angular.copy(RPCalculator.ifBlank(competitors, [])); },
                enumerable: true,
                configurable: true
            });
            Controller.$inject = ["$scope", "$workbook", "$route", "$routeParams", "$window", "$filter"];
            return Controller;
        }());
        Worksheet.Controller = Controller;
    })(Worksheet = RPCalculator.Worksheet || (RPCalculator.Worksheet = {}));
    var Scoring;
    (function (Scoring) {
        var Controller = /** @class */ (function (_super) {
            __extends(Controller, _super);
            function Controller() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.ranks = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
                _this.tabs = ["Scoring", "Calculation", "Results"];
                _this.tab = _this.tabs[0];
                return _this;
            }
            Object.defineProperty(Controller.prototype, "tops", {
                get: function () { return this.$filter("limitTo")([1, 2, 3, 4, 5, 6, 7, 8], this.competitors.length); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "top", {
                get: function () {
                    if (!(this.worksheet.top >= 1 && this.worksheet.top <= this.competitors.length)) {
                        this.worksheet.top = (this.competitors.length > 3) ? 3 : this.competitors.length;
                    }
                    return this.worksheet.top;
                },
                set: function (top) { this.worksheet.top = top; },
                enumerable: true,
                configurable: true
            });
            Controller.prototype.setTab = function (tab, $event) {
                $event.preventDefault();
                $event.stopPropagation();
                if (this.tabs.indexOf(tab) > 0)
                    this.calculate();
                this.tab = tab;
            };
            Object.defineProperty(Controller.prototype, "tabIndex", {
                get: function () { return this.tabs.indexOf(this.tab); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "templateUrl", {
                get: function () { return "Views/" + this.tab.toLowerCase() + ".html"; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "message", {
                get: function () {
                    if (this.form.$error.required)
                        return "Each judge must rank every competitor";
                    if (this.form.$error.parse || this.form.$error.min || this.form.$error.max)
                        return "Each score must be a numeric rank between 1 and " + this.competitors.length;
                    if (this.form.$error.duplicate)
                        return "Competitors cannot be tied by any judge";
                },
                enumerable: true,
                configurable: true
            });
            Controller.prototype.calculate = function () {
                var _this = this;
                var majority = Math.ceil(this.worksheet.judges.length / 2);
                this.worksheet.competitors.forEach(function (competitor) {
                    competitor.tally = [];
                    for (var i = 1; i <= _this.competitors.length; i++) {
                        var count = 0, sum = 0;
                        for (var j = 0; j < _this.judges.length; j++) {
                            if (competitor.scores[j] <= i) {
                                count++;
                                sum += competitor.scores[j];
                            }
                        }
                        if (count >= majority)
                            competitor.tally.push(-count, sum);
                        else
                            competitor.tally.push(null, null);
                    }
                });
                var predicates = [];
                console.log("Predicates", predicates);
                var _loop_1 = function (i) {
                    predicates.push(function (competitor) { return competitor.tally[i]; });
                };
                for (var i = 0; i < this.competitors.length * 2; i++) {
                    _loop_1(i);
                }
                this.$filter("orderBy")(this.competitors, predicates)
                    .forEach(function (competitor, index) {
                    competitor.rank = index + 1;
                });
            };
            Controller.prototype.copy = function () {
                console.log("copy");
                var copy = {
                    title: this.worksheet.title + " (Copy)",
                    judges: angular.copy(this.judges),
                    competitors: []
                };
                this.$filter("orderBy")(this.$filter("limitTo")(this.$filter("orderBy")(this.competitors, "rank"), this.top), "id")
                    .forEach(function (competitor) {
                    copy.competitors.push({ id: competitor.id, name: competitor.name, scores: [] });
                });
                this.$workbook.worksheets.push(copy);
                this.$workbook.go("/worksheets", this.$workbook.worksheets.indexOf(copy));
            };
            return Controller;
        }(Worksheet.Controller));
        Scoring.Controller = Controller;
    })(Scoring = RPCalculator.Scoring || (RPCalculator.Scoring = {}));
    var Score;
    (function (Score) {
        var Controller = /** @class */ (function () {
            function Controller($scope) {
                this.$scope = $scope;
            }
            Object.defineProperty(Controller.prototype, "worksheet", {
                get: function () { return this.$scope.$ctrl.worksheet; },
                enumerable: true,
                configurable: true
            });
            ;
            Object.defineProperty(Controller.prototype, "c", {
                get: function () { return this.$scope.$parent.$index; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "j", {
                get: function () { return this.$scope.$index; },
                enumerable: true,
                configurable: true
            });
            Controller.prototype.name = function (c, j) {
                if (c === void 0) { c = this.c; }
                if (j === void 0) { j = this.j; }
                return "c" + c + "j" + j;
            };
            Object.defineProperty(Controller.prototype, "tabIndex", {
                get: function () { return (this.j * this.worksheet.competitors.length) + (this.c + 1); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "value", {
                get: function () { return this.worksheet.competitors[this.c].scores[this.j]; },
                set: function (value) { this.worksheet.competitors[this.c].scores[this.j] = value; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "ngClass", {
                get: function () { return { "is-valid": this.ngModel.$valid, "is-invalid": this.ngModel.$invalid }; },
                enumerable: true,
                configurable: true
            });
            Controller.prototype.$postLink = function () {
                var _this = this;
                this.ngModel.$validators["min"] = function (modelValue, viewValue) { return modelValue >= 1; };
                this.ngModel.$validators["max"] = function (modelValue, viewValue) { return modelValue <= _this.worksheet.competitors.length; };
                this.ngModel.$validators["duplicate"] = function (modelValue, viewValue) {
                    for (var i = _this.c + 1; i < _this.worksheet.competitors.length; i++) {
                        if (modelValue === _this.worksheet.competitors[i].scores[_this.j])
                            return false;
                    }
                    return true;
                };
                this.ngModel.$viewChangeListeners.push(function () {
                    for (var i = 0; i < _this.c; i++) {
                        var ngModel = _this.form[_this.name(i, _this.j)];
                        ngModel.$validate();
                    }
                });
            };
            Controller.$inject = ["$scope"];
            return Controller;
        }());
        Score.Controller = Controller;
        function DirectiveFactory() {
            var factory = function () {
                return {
                    restrict: "A",
                    controller: Controller,
                    controllerAs: "$score",
                    bindToController: true,
                    require: { form: "^^form", ngModel: "ngModel", integer: "integer" },
                    priority: 50
                };
            };
            return factory;
        }
        Score.DirectiveFactory = DirectiveFactory;
    })(Score = RPCalculator.Score || (RPCalculator.Score = {}));
    var Editor;
    (function (Editor) {
        var EditController = /** @class */ (function (_super) {
            __extends(EditController, _super);
            function EditController($scope, $workbook, $route, $routeParams, $window, $filter) {
                var _this = _super.call(this, $scope, $workbook, $route, $routeParams, $window, $filter) || this;
                _this.$scope = $scope;
                _this.$workbook = $workbook;
                _this.$route = $route;
                _this.$routeParams = $routeParams;
                _this.$window = $window;
                _this.$filter = $filter;
                if (angular.isUndefined(_this.index) || angular.isUndefined(_this.$workbook.worksheets[_this.index]))
                    _this.$workbook.go();
                $scope.$on("$destroy", $scope.$on("$routeChangeStart", function ($event) {
                    if (_this.form && _this.form.$dirty) {
                        $event.preventDefault();
                        _this.$window.alert("Please save or undo your changes before continuing.");
                    }
                }));
                return _this;
            }
            Object.defineProperty(EditController.prototype, "validator", {
                get: function () { return this.$workbook[this.property.toLowerCase() + "ValidationError"]; },
                enumerable: true,
                configurable: true
            });
            ;
            EditController.prototype.getData = function (property, min, max) {
                this.property = RPCalculator.ifBlank(property, this.property);
                this.min = RPCalculator.ifBlank(min, this.min);
                this.max = RPCalculator.ifBlank(max, this.max);
                return angular.copy(this[this.property.toLowerCase()]);
            };
            Object.defineProperty(EditController.prototype, "rowTemplate", {
                get: function () { return "Views/" + this.property.toLowerCase() + ".html"; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(EditController.prototype, "message", {
                get: function () { return RPCalculator.ifBlank(this.validator(this.data), this.property); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(EditController.prototype, "valid", {
                get: function () { return RPCalculator.isBlank(this.validator(this.data)); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(EditController.prototype, "invalid", {
                get: function () { return !this.valid; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(EditController.prototype, "canAdd", {
                get: function () { return this.data.length < this.max; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(EditController.prototype, "canRemove", {
                get: function () { return this.data.length > this.min; },
                enumerable: true,
                configurable: true
            });
            EditController.prototype.remove = function (index) { this.data.splice(index, 1); this.form.$setDirty(); };
            EditController.prototype.moveUp = function (index) { RPCalculator.swapUp(this.data, index); this.form.$setDirty(); };
            EditController.prototype.moveDown = function (index) { RPCalculator.swapDown(this.data, index); this.form.$setDirty(); };
            EditController.prototype.save = function () { this[this.property.toLowerCase()] = angular.copy(RPCalculator.ifBlank(this.data, [])); this.form.$setPristine(); };
            EditController.prototype.undo = function () { this.data = this.getData(); this.form.$setPristine(); };
            EditController.prototype.goToWorksheet = function () { this.$workbook.go("/worksheets", this.index); };
            return EditController;
        }(Worksheet.Controller));
        Editor.EditController = EditController;
    })(Editor = RPCalculator.Editor || (RPCalculator.Editor = {}));
    var Judges;
    (function (Judges) {
        var Controller = /** @class */ (function (_super) {
            __extends(Controller, _super);
            function Controller() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.data = _this.getData("Judges", 3, RPCalculator.maxJudges);
                return _this;
            }
            Controller.prototype.add = function () { this.data.push({ name: null }); this.form.$setDirty(); };
            return Controller;
        }(Editor.EditController));
        Judges.Controller = Controller;
    })(Judges = RPCalculator.Judges || (RPCalculator.Judges = {}));
    var Competitors;
    (function (Competitors) {
        var Controller = /** @class */ (function (_super) {
            __extends(Controller, _super);
            function Controller() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.data = _this.getData("Competitors", 2, RPCalculator.maxCompetitors);
                return _this;
            }
            Controller.prototype.add = function () {
                var id = this.data.push({ id: null, name: null, scores: [] });
                this.data[id - 1].id = id;
                this.form.$setDirty();
            };
            return Controller;
        }(Editor.EditController));
        Competitors.Controller = Controller;
    })(Competitors = RPCalculator.Competitors || (RPCalculator.Competitors = {}));
    var Integer;
    (function (Integer) {
        var Controller = /** @class */ (function () {
            function Controller() {
            }
            Controller.prototype.$postLink = function () {
                var _this = this;
                this.ngModel.$parsers.unshift(function (value) {
                    if (_this.ngModel.$isEmpty(value))
                        return value;
                    return RPCalculator.toInt(value);
                });
            };
            return Controller;
        }());
        Integer.Controller = Controller;
        function DirectiveFactory() {
            var factory = function () {
                return {
                    restrict: "A",
                    controller: Controller,
                    bindToController: true,
                    require: { ngModel: "ngModel" },
                    priority: 100
                };
            };
            return factory;
        }
        Integer.DirectiveFactory = DirectiveFactory;
    })(Integer = RPCalculator.Integer || (RPCalculator.Integer = {}));
    var Upload;
    (function (Upload) {
        var Controller = /** @class */ (function () {
            function Controller($scope, $element, $workbook, $location, $window) {
                var _this = this;
                this.$scope = $scope;
                this.$element = $element;
                this.$workbook = $workbook;
                this.$location = $location;
                this.$window = $window;
                this.onChange = function (event) {
                    if (!_this.$window.confirm("The current workbook will be overwritten. Are you sure you want to continue?"))
                        return;
                    var input = event.target;
                    if (!input.files.length)
                        return;
                    var reader = new FileReader();
                    reader.onload = function () {
                        _this.$scope.$apply(function () {
                            _this.$workbook.workbook = angular.fromJson(reader.result);
                            _this.$location.path("/workbook");
                        });
                    };
                    reader.readAsText(input.files[0]);
                };
            }
            Controller.prototype.$postLink = function () {
                this.$element.bind("change", this.onChange);
            };
            Controller.$inject = ["$scope", "$element", "$workbook", "$location", "$window"];
            return Controller;
        }());
        Upload.Controller = Controller;
        function DirectiveFactory() {
            var factory = function () {
                return { restrict: "A", scope: false, controller: Controller };
            };
            return factory;
        }
        Upload.DirectiveFactory = DirectiveFactory;
    })(Upload = RPCalculator.Upload || (RPCalculator.Upload = {}));
})(RPCalculator || (RPCalculator = {}));
module.service("$workbook", RPCalculator.Workbook.Service);
module.controller("menuController", RPCalculator.Menu.Controller);
module.directive("integer", RPCalculator.Integer.DirectiveFactory());
module.directive("score", RPCalculator.Score.DirectiveFactory());
module.directive("upload", RPCalculator.Upload.DirectiveFactory());
//# sourceMappingURL=rpcalculator.js.map