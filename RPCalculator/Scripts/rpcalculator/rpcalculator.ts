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

namespace Example {
    export const workbook: RPCalculator.IWorkbook = {
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
    }
}

namespace RPCalculator {
    "use strict";
    export const maxJudges: number = 7;
    export const maxCompetitors: number = 8;
    export const textPattern = "(^[\\w\\s-]+$)";
    export const numberPattern = "(^\\d+$)";
    export interface IRootScopeService extends angular.IRootScopeService { textPattern: string; numberPattern: string; vclass: Function; }
    export interface IStorageService extends angular.storage.IStorageService { workbook: IWorkbook; }
    export interface IWorkbook { title: string; worksheets: IWorksheet[]; }
    export interface IWorksheet { title: string; judges: IJudge[]; competitors: ICompetitor[]; }
    export interface IJudge { name: string; }
    export interface ICompetitor { id: number; name: string; }
    export function isBlank(value: any): boolean {
        if (angular.isUndefined(value)) return true;
        if (value === null) return true;
        if (angular.isArray(value)) return (value as any[]).length === 0;
        if (angular.isObject(value)) return angular.toJson(value) === angular.toJson({});
        if (String(value).trim() === "") return true;
        if (isNaN(value)) return true;
        return false;
    }
    export function ifBlank<T>(value: T, defaultValue: T): T { return (isBlank(value)) ? defaultValue : value; }
    export function swap(array: any[], index1: number, index2: number): void {
        let temp: any = array[index1];
        array[index1] = array[index2];
        array[index2] = temp;
    }
}

let xyz: Array<string>;

namespace RPCalculator {
    "use strict";
    export function toInt(value: string): number {
        let regExp: RegExp = new RegExp(numberPattern);
        if (!regExp.test(value)) return;
        return parseInt(regExp.exec(value)[1], 10);
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
                this.$localStorage.workbook = ifBlank(this.$localStorage.workbook, Example.workbook);
                return this.$localStorage.workbook;
            }
            public get title(): string {
                if (angular.isUndefined(this.workbook.title)) this.workbook.title = "New Workbook";
                return this.workbook.title;
            }
            public set title(title: string) { this.workbook.title = title; }
            public get worksheets(): IWorksheet[] {
                if (!angular.isArray(this.workbook.worksheets)) this.workbook.worksheets = [];
                return this.workbook.worksheets;
            }
            public validateJudges(judges: IJudge[]): boolean { return !this.judgesValidationError(judges); }
            public judgesValidationError(judges: IJudge[]): string {
                if (isBlank(judges) || !angular.isArray(judges) || judges.length < 3) return "There must be at least 3 judges";
                if (judges.length > maxJudges) return "There cannot be more than " + maxJudges + " judges";
                if (judges.length % 2 === 0) return "There must be an odd number of judges";
                return;
            }
        }
        export class Controller {
            static $inject: string[] = ["$wb"];
            constructor(public $wb: Service) { }
        }
    }
    export namespace Worksheet {
        export abstract class BaseController {
            static $inject: string[] = ["$scope", "$wb", "$route", "$routeParams", "$window"];
            constructor(
                protected $scope: angular.IScope,
                protected $wb: Workbook.Service,
                protected $route: angular.route.IRouteService,
                protected $routeParams: angular.route.IRouteParamsService,
                protected $window: angular.IWindowService) {
                if (angular.isUndefined(this.index) || angular.isUndefined(this.$wb.worksheets[this.index])) this.$wb.go();
                $scope.$on("$destroy", $scope.$on("$routeChangeStart", ($event: angular.IAngularEvent): void => {
                    if (this.form && this.form.$dirty) {
                        $event.preventDefault();
                        this.$window.alert("Please save or undo your changes before continuing.");
                    }
                }));
            }
            public get form(): angular.IFormController { return this.$scope["form"]; }
            public get index(): number { return toInt(this.$routeParams["index"]); }
            public get worksheet(): IWorksheet { return this.$wb.worksheets[this.index]; }
            public judges: IJudge[] = angular.copy(this.worksheet.judges);
        }
        export class Controller extends BaseController {
        }
    }
    export namespace Judges {
        export class Controller extends Worksheet.BaseController {
            public get valid(): boolean { return this.form.$valid && this.$wb.validateJudges(this.judges); }
            public get invalid(): boolean { return !this.valid; }
            public get error(): string {
                if (this.form.$error.required) return "Every judge must be given a name."
                return this.$wb.judgesValidationError(this.judges);
            }
            public get canAdd(): boolean { return this.judges.length < maxJudges; }
            public add(): void {
                if (!angular.isArray(this.worksheet.judges)) this.worksheet.judges = [];
                this.judges.push({ name: null });
                this.form.$setDirty();
            }
            public get canRemove(): boolean { return this.judges.length > 3; }
            public remove(index): void {
                this.judges.splice(index, 1);
                this.form.$setDirty();
            }
            public moveUp(index: number): void {
                swap(this.judges, index, index - 1);
                this.form.$setDirty();
            }
            public moveDown(index: number): void {
                swap(this.judges, index, index + 1);
                this.form.$setDirty();
            }
            public save(): void {
                this.$wb.worksheets[this.index].judges = angular.copy(this.judges);
                this.form.$setPristine();
            }
            public undo(): void {
                this.judges = angular.copy(this.worksheet.judges);
                this.form.$setPristine();
            }
        }
    }
}

module.service("$wb", RPCalculator.Workbook.Service);
