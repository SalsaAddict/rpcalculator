/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/angularjs/angular-route.d.ts" />
/// <reference path="../typings/ngstorage/ngstorage.d.ts" />

let module: angular.IModule = angular.module("rpcalc", ["ngRoute", "ngMessages", "ngStorage"]);

module.config(["$routeProvider", function ($routeProvider: angular.route.IRouteProvider) {
    $routeProvider
        .when("/workbook", { templateUrl: "Views/workbook.html", controller: RPCalculator.Workbook.Controller, controllerAs: "$ctrl" })
        .when("/worksheets/:index", { templateUrl: "Views/worksheet.html", controller: RPCalculator.Worksheet.Controller, controllerAs: "$ctrl" })
        .when("/judges/:index", { templateUrl: "Views/judges.html", controller: RPCalculator.Judges.Controller, controllerAs: "$ctrl" })
        .when("/competitors/:index", { templateUrl: "Views/competitors.html", controller: RPCalculator.Competitors.Controller, controllerAs: "$ctrl" })
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
        if (value === NaN) return true;
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
            public validateJudges(judges: IJudge[]): boolean { return isBlank(this.judgesValidationError(judges)); }
            public judgesValidationError(judges: IJudge[]): string {
                if (isBlank(judges) || !angular.isArray(judges) || judges.length < 3) return "There must be at least 3 judges";
                if (judges.length > maxJudges) return "There cannot be more than " + maxJudges + " judges";
                if (judges.length % 2 === 0) return "There must be an odd number of judges";
                let names: string[] = [];
                for (let i: number = 0; i < judges.length; i++) {
                    if (isBlank(judges[i]) || isBlank(judges[i].name)) return "Each judge must have a name";
                    if (names.indexOf(judges[i].name) >= 0) return "Each judge must have a unique name";
                    names.push(judges[i].name);
                }
                return;
            }
            public competitorsValidationError(competitors: ICompetitor[]): string {
                if (isBlank(competitors) || !angular.isArray(competitors) || competitors.length < 2) return "There must be at least 2 competitors";
                if (competitors.length > maxCompetitors) return "There cannot be more than " + maxCompetitors + " competitors";
                let ids: number[] = [], names: string[] = [];
                for (let i: number = 0; i < competitors.length; i++) {
                    if (isBlank(competitors[i]) || isBlank(competitors[i].id)) return "Each competitor must have a number";
                    if (ids.indexOf(competitors[i].id) >= 0) return "Each competitor must have a unique number";
                    if (isBlank(competitors[i].name)) return "Each competitor must have a name";
                    if (names.indexOf(competitors[i].name) >= 0) return "Each competitor must have a unique name";
                    ids.push(competitors[i].id);
                    names.push(competitors[i].name);
                }
                return;
            }
            public validateCompetitors(competitors: ICompetitor[]): boolean { return isBlank(this.competitorsValidationError(competitors)); }
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
            public competitors: ICompetitor[] = angular.copy(this.worksheet.competitors);
        }
        export class Controller extends BaseController {
        }
    }
    export namespace Judges {
        export class Controller extends Worksheet.BaseController {
            public get valid(): boolean { return this.$wb.validateJudges(this.judges); }
            public get invalid(): boolean { return !this.valid; }
            public get message(): string { return ifBlank(this.$wb.judgesValidationError(this.judges), "The judges are valid"); }
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
    export namespace Competitors {
        export class Controller extends Worksheet.BaseController {
            public get valid(): boolean { return this.$wb.validateCompetitors(this.competitors); }
            public get invalid(): boolean { return !this.valid; }
            public get message(): string { return ifBlank(this.$wb.competitorsValidationError(this.competitors), "The competitors are valid"); }
            public get canAdd(): boolean { return this.competitors.length < maxCompetitors; }
            public add(): void {
                if (!angular.isArray(this.worksheet.competitors)) this.worksheet.competitors = [];
                let id: number = this.competitors.push({ id: null, name: null });
                this.competitors[id - 1].id = id;
                this.form.$setDirty();
            }
            public get canRemove(): boolean { return this.competitors.length > 2; }
            public remove(index): void {
                this.competitors.splice(index, 1);
                this.form.$setDirty();
            }
            public moveUp(index: number): void {
                swap(this.competitors, index, index - 1);
                this.form.$setDirty();
            }
            public moveDown(index: number): void {
                swap(this.competitors, index, index + 1);
                this.form.$setDirty();
            }
            public save(): void {
                this.$wb.worksheets[this.index].competitors = angular.copy(this.competitors);
                this.form.$setPristine();
            }
            public undo(): void {
                this.competitors = angular.copy(this.worksheet.competitors);
                this.form.$setPristine();
            }
        }
    }
}

module.service("$wb", RPCalculator.Workbook.Service);
