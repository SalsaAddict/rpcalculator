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
var module = angular.module("rpcalc", ["ngRoute", "ngMessages", "ngStorage"]);
module.config(["$routeProvider", function ($routeProvider) {
        $routeProvider
            .when("/workbook", { templateUrl: "Views/workbook.html", controller: RPCalculator.Workbook.Controller, controllerAs: "$ctrl" })
            .when("/worksheets/:index", { templateUrl: "Views/worksheet.html", controller: RPCalculator.Worksheet.Controller, controllerAs: "$ctrl" })
            .when("/judges/:index", { templateUrl: "Views/judges.html", controller: RPCalculator.Judges.Controller, controllerAs: "$ctrl" })
            .when("/competitors/:index", { templateUrl: "Views/competitors.html", controller: RPCalculator.Competitors.Controller, controllerAs: "$ctrl" })
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
var Example;
(function (Example) {
    Example.workbook = {
        title: "Skating System Example",
        worksheets: [
            {
                title: "Simple Example",
                judges: [{ name: "John" }, { name: "Beyoncé" }, { name: "Paul" }, { name: "Kelly" }, { name: "George" }, { name: "Michelle" }, { name: "Ringo" }],
                competitors: []
            },
            { title: "Intermediate Example", judges: [], competitors: [] },
            { title: "Complex Example", judges: [], competitors: [] },
        ]
    };
})(Example || (Example = {}));
var RPCalculator;
(function (RPCalculator) {
    "use strict";
    RPCalculator.maxJudges = 7;
    RPCalculator.maxCompetitors = 8;
    RPCalculator.textPattern = "(^[\\w\\s-]+$)";
    RPCalculator.numberPattern = "(^\\d+$)";
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
})(RPCalculator || (RPCalculator = {}));
(function (RPCalculator) {
    "use strict";
    function toInt(value) {
        var regExp = new RegExp(RPCalculator.numberPattern);
        if (!regExp.test(value))
            return;
        return parseInt(regExp.exec(value)[1], 10);
    }
    RPCalculator.toInt = toInt;
    var Workbook;
    (function (Workbook) {
        var Service = /** @class */ (function () {
            function Service($localStorage, $location) {
                this.$localStorage = $localStorage;
                this.$location = $location;
            }
            Service.prototype.go = function (path, index) {
                if (path === void 0) { path = "/workbook"; }
                if (index >= 0)
                    path += "/" + index;
                this.$location.path(path);
            };
            Object.defineProperty(Service.prototype, "workbook", {
                get: function () {
                    this.$localStorage.workbook = RPCalculator.ifBlank(this.$localStorage.workbook, Example.workbook);
                    return this.$localStorage.workbook;
                },
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
            Service.$inject = ["$localStorage", "$location"];
            return Service;
        }());
        Workbook.Service = Service;
        var Controller = /** @class */ (function () {
            function Controller($wb) {
                this.$wb = $wb;
            }
            Controller.$inject = ["$wb"];
            return Controller;
        }());
        Workbook.Controller = Controller;
    })(Workbook = RPCalculator.Workbook || (RPCalculator.Workbook = {}));
    var Worksheet;
    (function (Worksheet) {
        var BaseController = /** @class */ (function () {
            function BaseController($scope, $wb, $route, $routeParams, $window) {
                var _this = this;
                this.$scope = $scope;
                this.$wb = $wb;
                this.$route = $route;
                this.$routeParams = $routeParams;
                this.$window = $window;
                if (angular.isUndefined(this.index) || angular.isUndefined(this.$wb.worksheets[this.index]))
                    this.$wb.go();
                $scope.$on("$destroy", $scope.$on("$routeChangeStart", function ($event) {
                    if (_this.form && _this.form.$dirty) {
                        $event.preventDefault();
                        _this.$window.alert("Please save or undo your changes before continuing.");
                    }
                }));
            }
            BaseController.prototype.goToWorksheet = function () { this.$wb.go("/worksheets", this.index); };
            Object.defineProperty(BaseController.prototype, "form", {
                get: function () { return this.$scope["form"]; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BaseController.prototype, "index", {
                get: function () { return toInt(this.$routeParams["index"]); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BaseController.prototype, "worksheet", {
                get: function () { return this.$wb.worksheets[this.index]; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BaseController.prototype, "judges", {
                get: function () { return RPCalculator.ifBlank(this.worksheet.judges, []); },
                set: function (judges) { this.worksheet.judges = angular.copy(RPCalculator.ifBlank(judges, [])); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BaseController.prototype, "competitors", {
                get: function () { return RPCalculator.ifBlank(this.worksheet.competitors, []); },
                set: function (competitors) { this.worksheet.competitors = angular.copy(RPCalculator.ifBlank(competitors, [])); },
                enumerable: true,
                configurable: true
            });
            BaseController.$inject = ["$scope", "$wb", "$route", "$routeParams", "$window"];
            return BaseController;
        }());
        Worksheet.BaseController = BaseController;
        var EditController = /** @class */ (function (_super) {
            __extends(EditController, _super);
            function EditController() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Object.defineProperty(EditController.prototype, "validator", {
                get: function () { return this.$wb[this.property.toLowerCase() + "ValidationError"]; },
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
            return EditController;
        }(BaseController));
        Worksheet.EditController = EditController;
        var Controller = /** @class */ (function (_super) {
            __extends(Controller, _super);
            function Controller() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Controller.prototype.scores = function (competitor) {
                if (RPCalculator.isBlank(competitor.scores))
                    competitor.scores = [];
                return competitor.scores;
            };
            return Controller;
        }(BaseController));
        Worksheet.Controller = Controller;
    })(Worksheet = RPCalculator.Worksheet || (RPCalculator.Worksheet = {}));
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
        }(Worksheet.EditController));
        Judges.Controller = Controller;
    })(Judges = RPCalculator.Judges || (RPCalculator.Judges = {}));
    var Competitors;
    (function (Competitors) {
        var Controller = /** @class */ (function (_super) {
            __extends(Controller, _super);
            function Controller() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Object.defineProperty(Controller.prototype, "valid", {
                get: function () { return this.$wb.validateCompetitors(this.competitors); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "invalid", {
                get: function () { return !this.valid; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "message", {
                get: function () { return RPCalculator.ifBlank(this.$wb.competitorsValidationError(this.competitors), "Competitors"); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "canAdd", {
                get: function () { return this.competitors.length < RPCalculator.maxCompetitors; },
                enumerable: true,
                configurable: true
            });
            Controller.prototype.add = function () {
                if (!angular.isArray(this.worksheet.competitors))
                    this.worksheet.competitors = [];
                var id = this.competitors.push({ id: null, name: null, scores: [] });
                this.competitors[id - 1].id = id;
                this.form.$setDirty();
            };
            Object.defineProperty(Controller.prototype, "canRemove", {
                get: function () { return this.competitors.length > 2; },
                enumerable: true,
                configurable: true
            });
            Controller.prototype.remove = function (index) {
                this.competitors.splice(index, 1);
                this.form.$setDirty();
            };
            Controller.prototype.moveUp = function (index) {
                RPCalculator.swap(this.competitors, index, index - 1);
                this.form.$setDirty();
            };
            Controller.prototype.moveDown = function (index) {
                RPCalculator.swap(this.competitors, index, index + 1);
                this.form.$setDirty();
            };
            Controller.prototype.save = function () {
                this.$wb.worksheets[this.index].competitors = angular.copy(RPCalculator.ifBlank(this.competitors, []));
                this.form.$setPristine();
            };
            Controller.prototype.undo = function () {
                this.competitors = angular.copy(RPCalculator.ifBlank(this.worksheet.competitors, []));
                this.form.$setPristine();
            };
            return Controller;
        }(Worksheet.BaseController));
        Competitors.Controller = Controller;
    })(Competitors = RPCalculator.Competitors || (RPCalculator.Competitors = {}));
})(RPCalculator || (RPCalculator = {}));
module.service("$wb", RPCalculator.Workbook.Service);
//# sourceMappingURL=rpcalculator.js.map