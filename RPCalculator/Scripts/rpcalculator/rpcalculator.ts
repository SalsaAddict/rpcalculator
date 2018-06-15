/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/angularjs/angular-route.d.ts" />
/// <reference path="../typings/ngstorage/ngstorage.d.ts" />

let module: angular.IModule = angular.module("rpcalc", ["ngRoute", "ngMessages", "ngStorage"]);

module.config(["$routeProvider", function ($routeProvider: angular.route.IRouteProvider) {
    $routeProvider
        .when("/workbook", { templateUrl: "Views/workbook.html", controller: RPCalculator.Workbook.Controller, controllerAs: "$ctrl" })
        .when("/worksheets/:index", { templateUrl: "Views/worksheet.html", controller: RPCalculator.Worksheet.Controller, controllerAs: "$ctrl" })
        .when("/judges/:index", { templateUrl: "Views/judges.html", controller: RPCalculator.Judges.Controller, controllerAs: "$ctrl" })
        .otherwise({ redirectTo: "/workbook" })
        .caseInsensitiveMatch = true;
}]);

module.run(["$rootScope", function ($rootScope: RPCalculator.IRootScopeService) {
    $rootScope.textPattern = RPCalculator.textPattern;
    $rootScope.numberPattern = RPCalculator.numberPattern;
    $rootScope.vclass = function (
        controller: angular.IFormController | angular.INgModelController,
        classIfValid: string = 'is-valid',
        classIfInvalid: string = 'is-invalid') {
        let output: any = {};
        if (classIfValid !== null) Object.defineProperty(output, classIfValid, { get: function () { return controller.$valid; }, enumerable: true });
        if (classIfInvalid !== null) Object.defineProperty(output, classIfInvalid, { get: function () { return controller.$invalid; }, enumerable: true });
        return output;
    };
}]);

namespace RPCalculator {
    "use strict";
    export interface IRootScopeService extends angular.IRootScopeService { textPattern: string; numberPattern: string; vclass: Function; }
    export interface IStorageService extends angular.storage.IStorageService { workbook: IWorkbook; }
    export interface IWorkbook { title: string; worksheets?: ISheet[]; }
    export interface ISheet { title: string; judges?: string[]; competitors?: ICompetitor[]; }
    export interface ICompetitor { id: number; name: string; }
    export const textPattern = "(^[\\w\\s-]+$)";
    export const numberPattern = "(^\\d+$)";
    export function toInt(value: string): number {
        let regExp: RegExp = new RegExp(numberPattern);
        if (!regExp.test(value)) return;
        return parseInt(regExp.exec(value)[1], 10);
    }
    export const Example: IWorkbook = {
        title: "Skating System Example",
        worksheets: [
            { title: "Simple Example", judges: ["John", "Paul", "George", "Ringo", "Beyoncé", "Kelly", "Michelle"] },
            { title: "Intermediate Example" },
            { title: "Complex Example" },
        ]
    }
    export namespace Workbook {
        export class Service {
            static $inject: string[] = ["$localStorage", "$location"];
            constructor(
                private $localStorage: IStorageService,
                private $location: angular.ILocationService) { }
            public go(path: string = "/workbook", index?: number): void {
                if (index >= 0) path += "/" + index;
                this.$location.path(path);
            }
            public get workbook(): IWorkbook {
                if (angular.isUndefined(this.$localStorage.workbook)) this.$localStorage.workbook = Example;
                return this.$localStorage.workbook;
            }
            public get title(): string {
                if (angular.isUndefined(this.workbook.title)) this.workbook.title = "New Workbook";
                return this.workbook.title;
            }
            public set title(title: string) { this.workbook.title = title; }
            public get worksheets(): ISheet[] {
                if (!angular.isArray(this.workbook.worksheets)) this.workbook.worksheets = [];
                return this.workbook.worksheets;
            }
            public judgesValidationError(worksheet: ISheet): string {
                if (!angular.isArray(worksheet.judges) || worksheet.judges.length < 3) return "There must be at least 3 judges";
                if (worksheet.judges.length > 7) return "There cannot be more than 7 judges";
                if (worksheet.judges.length % 2 === 0) return "There must be an odd number of judges";
                return;
            }
            public validateJudges(worksheet: ISheet): boolean { return !this.judgesValidationError(worksheet); }
        }
        export class Controller {
            static $inject: string[] = ["$wb"];
            constructor(public $wb: Service) { }
        }
    }
    export namespace Worksheet {
        export abstract class BaseController {
            constructor() { if (angular.isUndefined(this.index) || angular.isUndefined(this.$wb.worksheets[this.index])) this.$wb.go(); }
            protected abstract $wb: Workbook.Service;
            protected abstract $routeParams: angular.route.IRouteParamsService
            public get index(): number { return toInt(this.$routeParams["index"]); }
            public get worksheet(): ISheet { return this.$wb.worksheets[this.index]; }
        }
        export class Controller extends BaseController {
            static $inject: string[] = ["$wb", "$routeParams"];
            constructor(protected $wb: Workbook.Service, protected $routeParams: angular.route.IRouteParamsService) {
                super();
                if (!$wb.validateJudges(this.worksheet)) $wb.go("/judges", this.index);
            }
            public get judges(): string[] {
                if (!angular.isArray(this.worksheet.judges)) this.worksheet.judges = [];
                return this.worksheet.judges;
            }
        }
    }
    export namespace Judges {
        export class Controller extends Worksheet.BaseController {
            static $inject: string[] = ["$wb", "$routeParams"];
            constructor(protected $wb: Workbook.Service, protected $routeParams: angular.route.IRouteParamsService) {
                super();
            }
            public get invalid(): boolean { return !this.$wb.validateJudges(this.worksheet); }
            public get error(): string { return this.$wb.judgesValidationError(this.worksheet); }
        }
    }
}

module.service("$wb", RPCalculator.Workbook.Service);