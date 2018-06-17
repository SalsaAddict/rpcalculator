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
        if (isNaN(value))
            return true;
        return false;
    }
    RPCalculator.isBlank = isBlank;
    function ifBlank(value, defaultValue) { return (isBlank(value)) ? defaultValue : value; }
    RPCalculator.ifBlank = ifBlank;
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
            Service.prototype.validateJudges = function (judges) { return !this.judgesValidationError(judges); };
            Service.prototype.judgesValidationError = function (judges) {
                if (RPCalculator.isBlank(judges) || !angular.isArray(judges) || judges.length < 3)
                    return "There must be at least 3 judges";
                if (judges.length > RPCalculator.maxJudges)
                    return "There cannot be more than " + RPCalculator.maxJudges + " judges";
                if (judges.length % 2 === 0)
                    return "There must be an odd number of judges";
                return;
            };
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
            function BaseController($wb, $routeParams) {
                this.$wb = $wb;
                this.$routeParams = $routeParams;
                this.judges = angular.copy(this.worksheet.judges);
                if (angular.isUndefined(this.index) || angular.isUndefined(this.$wb.worksheets[this.index]))
                    this.$wb.go();
            }
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
            BaseController.$inject = ["$wb", "$routeParams"];
            return BaseController;
        }());
        Worksheet.BaseController = BaseController;
        var Controller = /** @class */ (function (_super) {
            __extends(Controller, _super);
            function Controller($wb, $routeParams) {
                var _this = _super.call(this, $wb, $routeParams) || this;
                if (!$wb.validateJudges(_this.worksheet.judges))
                    $wb.go("/judges", _this.index);
                return _this;
            }
            Object.defineProperty(Controller.prototype, "judges", {
                get: function () {
                    if (!angular.isArray(this.worksheet.judges))
                        this.worksheet.judges = [];
                    return this.worksheet.judges;
                },
                enumerable: true,
                configurable: true
            });
            return Controller;
        }(BaseController));
        Worksheet.Controller = Controller;
    })(Worksheet = RPCalculator.Worksheet || (RPCalculator.Worksheet = {}));
    var Judges;
    (function (Judges) {
        var Controller = /** @class */ (function (_super) {
            __extends(Controller, _super);
            function Controller($wb, $routeParams) {
                return _super.call(this, $wb, $routeParams) || this;
            }
            Object.defineProperty(Controller.prototype, "invalid", {
                get: function () { return !this.$wb.validateJudges(this.judges); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "error", {
                get: function () { return this.$wb.judgesValidationError(this.judges); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Controller.prototype, "canAdd", {
                get: function () { return this.judges.length < RPCalculator.maxJudges; },
                enumerable: true,
                configurable: true
            });
            Controller.prototype.add = function () {
                if (!angular.isArray(this.worksheet.judges))
                    this.worksheet.judges = [];
                this.judges.push({ name: null });
            };
            Object.defineProperty(Controller.prototype, "canRemove", {
                get: function () { return this.judges.length > 3; },
                enumerable: true,
                configurable: true
            });
            Controller.prototype.remove = function (index) { this.judges.splice(index, 1); };
            Controller.prototype.moveUp = function (index) {
                var judge = this.judges[index];
                this.judges[index] = this.judges[index - 1];
                this.judges[index - 1] = judge;
            };
            Controller.prototype.moveDown = function (index) {
                var judge = this.judges[index];
                this.judges[index] = this.judges[index + 1];
                this.judges[index + 1] = judge;
            };
            return Controller;
        }(Worksheet.BaseController));
        Judges.Controller = Controller;
    })(Judges = RPCalculator.Judges || (RPCalculator.Judges = {}));
})(RPCalculator || (RPCalculator = {}));
module.service("$wb", RPCalculator.Workbook.Service);
//# sourceMappingURL=rpcalculator.js.map