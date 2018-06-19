/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/angularjs/angular-route.d.ts" />
/// <reference path="../typings/ngstorage/ngstorage.d.ts" />

let module: angular.IModule = angular.module("rpcalc", ["ngRoute", "ngStorage"]);

module.config(["$routeProvider", function ($routeProvider: angular.route.IRouteProvider) {
    $routeProvider
        .when("/workbook", { templateUrl: "Views/workbook.html", controller: RPCalculator.Workbook.Controller, controllerAs: "$ctrl" })
        .when("/worksheets/:index", { templateUrl: "Views/worksheet.html", controller: RPCalculator.Scoring.Controller, controllerAs: "$ctrl" })
        .when("/judges/:index", { templateUrl: "Views/editor.html", controller: RPCalculator.Judges.Controller, controllerAs: "$ctrl" })
        .when("/competitors/:index", { templateUrl: "Views/editor.html", controller: RPCalculator.Competitors.Controller, controllerAs: "$ctrl" })
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
    export interface ICompetitor { id: number; name: string; scores: number[]; tally?: number[]; rank?: number; }
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
    export function swapUp(array: any[], index: number): void { swap(array, index, index - 1); }
    export function swapDown(array: any[], index: number): void { swap(array, index, index + 1); }
    export function toInt(value: string): number {
        let regExp: RegExp = new RegExp(numberPattern);
        if (!regExp.test(value)) return;
        return parseInt(regExp.exec(value)[1], 10);
    }
}

namespace RPCalculator {
    "use strict";
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
            static $inject: string[] = ["$workbook"];
            constructor(private $workbook: Service) { }
            public get worksheets(): IWorksheet[] { return this.$workbook.worksheets; }
        }
    }
    export namespace Worksheet {
        export abstract class Controller {
            static $inject: string[] = ["$scope", "$workbook", "$route", "$routeParams", "$window", "$filter", "$timeout"];
            constructor(
                protected $scope: angular.IScope,
                protected $workbook: Workbook.Service,
                protected $route: angular.route.IRouteService,
                protected $routeParams: angular.route.IRouteParamsService,
                protected $window: angular.IWindowService,
                protected $filter: angular.IFilterService,
                protected $timeout: angular.ITimeoutService) {
                if (angular.isUndefined(this.index) || angular.isUndefined(this.$workbook.worksheets[this.index])) this.$workbook.go();
            }
            public get form(): angular.IFormController { return this.$scope["form"]; }
            public get index(): number { return toInt(this.$routeParams["index"]); }
            public get worksheet(): IWorksheet { return this.$workbook.worksheets[this.index]; }
            public get judges(): IJudge[] { return ifBlank(this.worksheet.judges, []); }
            public set judges(judges: IJudge[]) { this.worksheet.judges = angular.copy(ifBlank(judges, [])); }
            public get competitors(): ICompetitor[] { return ifBlank(this.worksheet.competitors, []); }
            public set competitors(competitors: ICompetitor[]) { this.worksheet.competitors = angular.copy(ifBlank(competitors, [])); }
        }
    }
    export namespace Scoring {
        interface IPredicate { (competitor: ICompetitor): number; }
        export class Controller extends Worksheet.Controller {
            public ranks: string[] = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
            public tabs: string[] = ["Scoring", "Calculation", "Results"];
            public tab: string = this.tabs[0];
            public setTab(tab: string, $event: angular.IAngularEvent): void {
                $event.preventDefault();
                $event.stopPropagation();
                if (this.tabIndex > 0) this.calculate();
                this.$timeout((): void => { this.tab = tab; });
            }
            public get tabIndex(): number { return this.tabs.indexOf(this.tab); }
            public get templateUrl(): string { return "Views/" + this.tab.toLowerCase() + ".html"; }
            public get message(): string {
                if (this.form.$error.required) return "Each judge must rank every competitor";
                if (this.form.$error.parse || this.form.$error.min || this.form.$error.max) return "Each score must be a numeric rank between 1 and " + this.competitors.length;
                if (this.form.$error.duplicate) return "Competitors cannot be tied by any judge";
            }
            public calculate(): void {
                const majority: number = Math.ceil(this.judges.length % 2);
                this.worksheet.competitors.forEach((competitor: ICompetitor): void => {
                    competitor.tally = [];
                    for (let i: number = 1; i <= this.competitors.length; i++) {
                        let count: number = 0, sum: number = 0;
                        for (let j: number = 0; j < this.judges.length; j++) {
                            if (competitor.scores[j] <= i) { count++; sum += competitor.scores[j]; }
                        }
                        if (count >= majority) competitor.tally.push(-count, sum); else competitor.tally.push(null, null);
                    }
                });
                let predicates: IPredicate[] = [];
                for (let i: number = 0; i < this.judges.length * 2; i++) {
                    predicates.push(function (competitor: ICompetitor): number { return competitor.tally[i]; });
                }
                this.$filter("orderBy")(this.competitors, predicates)
                    .forEach(function (competitor: ICompetitor, index: number): void {
                        competitor.rank = index + 1;
                    });
            }
        }
    }
    export namespace Score {
        export class Controller implements angular.IController {
            static $inject: string[] = ["$scope"];
            constructor(private $scope: angular.IScope) { }
            public get worksheet(): Scoring.Controller { return this.$scope.$ctrl.worksheet; };
            public get c(): number { return this.$scope.$parent.$index; }
            public get j(): number { return this.$scope.$index; }
            public get name(): string { return "c" + this.c + "j" + this.j; }
            public get tabIndex(): number { return (this.j * this.worksheet.competitors.length) + (this.c + 1); }
            public get value(): any { return this.worksheet.competitors[this.c].scores[this.j]; }
            public set value(value: any) { this.worksheet.competitors[this.c].scores[this.j] = value; }
            public get ngClass(): any { return { "is-valid": this.ngModel.$valid, "is-invalid": this.ngModel.$invalid }; }
            public ngModel: angular.INgModelController;
            public $postLink(): void {
                this.ngModel.$validators["min"] = (modelValue: number, viewValue: any): boolean => { return modelValue >= 1; }
                this.ngModel.$validators["max"] = (modelValue: number, viewValue: any): boolean => { return modelValue <= this.worksheet.competitors.length; }
                this.ngModel.$validators["duplicate"] = (modelValue: number, viewValue: any): boolean => {
                    for (let i: number = this.c + 1; i < this.worksheet.competitors.length; i++) {
                        if (modelValue === this.worksheet.competitors[i].scores[this.j]) return false;
                    }
                    return true;
                }
            }
        }
        export function DirectiveFactory(): angular.IDirectiveFactory {
            let factory: angular.IDirectiveFactory = function (): angular.IDirective {
                return {
                    restrict: "A",
                    controller: Controller,
                    controllerAs: "$score",
                    bindToController: true,
                    require: { ngModel: "ngModel", integer: "integer" },
                    priority: 50
                };
            };
            return factory;
        }
    }
    export namespace Editor {
        export type PropertyType = "Judges" | "Competitors";
        export interface IValidatorFn { (data: any[]): string; }
        export abstract class EditController extends Worksheet.Controller {
            constructor(
                protected $scope: angular.IScope,
                protected $workbook: Workbook.Service,
                protected $route: angular.route.IRouteService,
                protected $routeParams: angular.route.IRouteParamsService,
                protected $window: angular.IWindowService,
                protected $filter: angular.IFilterService,
                protected $timeout: angular.ITimeoutService) {
                super($scope, $workbook, $route, $routeParams, $window, $filter, $timeout);
                if (angular.isUndefined(this.index) || angular.isUndefined(this.$workbook.worksheets[this.index])) this.$workbook.go();
                $scope.$on("$destroy", $scope.$on("$routeChangeStart", ($event: angular.IAngularEvent): void => {
                    if (this.form && this.form.$dirty) {
                        $event.preventDefault();
                        this.$window.alert("Please save or undo your changes before continuing.");
                    }
                }));
            } private property: PropertyType;
            private min: number;
            private max: number;
            private get validator(): IValidatorFn { return this.$workbook[this.property.toLowerCase() + "ValidationError"]; };
            public abstract data: any[];
            public getData(property?: PropertyType, min?: number, max?: number): any[] {
                this.property = ifBlank(property, this.property);
                this.min = ifBlank(min, this.min);
                this.max = ifBlank(max, this.max);
                return angular.copy(this[this.property.toLowerCase()]);
            }
            public get rowTemplate(): string { return "Views/" + this.property.toLowerCase() + ".html"; }
            public get message(): string { return ifBlank(this.validator(this.data), this.property); }
            public get valid(): boolean { return isBlank(this.validator(this.data)); }
            public get invalid(): boolean { return !this.valid; }
            public get canAdd(): boolean { return this.data.length < this.max; }
            public abstract add(): void;
            public get canRemove(): boolean { return this.data.length > this.min; }
            public remove(index: number): void { this.data.splice(index, 1); this.form.$setDirty(); }
            public moveUp(index: number): void { swapUp(this.data, index); this.form.$setDirty(); }
            public moveDown(index: number): void { swapDown(this.data, index); this.form.$setDirty(); }
            public save(): void { this[this.property.toLowerCase()] = angular.copy(ifBlank(this.data, [])); this.form.$setPristine(); }
            public undo(): void { this.data = this.getData(); this.form.$setPristine(); }
            public goToWorksheet(): void { this.$workbook.go("/worksheets", this.index); }
        }
    }
    export namespace Judges {
        export class Controller extends Editor.EditController {
            public data: any[] = this.getData("Judges", 3, maxJudges);
            public add(): void { this.data.push({ name: null }); this.form.$setDirty(); }
        }
    }
    export namespace Competitors {
        export class Controller extends Editor.EditController {
            public data: any[] = this.getData("Competitors", 2, maxCompetitors);
            public add(): void {
                let id: number = this.data.push({ id: null, name: null, scores: [] });
                this.data[id - 1].id = id;
                this.form.$setDirty();
            }
        }
    }
    export namespace Integer {
        export class Controller implements angular.IController {
            public ngModel: angular.INgModelController;
            public $postLink(): void {
                this.ngModel.$parsers.unshift((value: any): any => {
                    if (this.ngModel.$isEmpty(value)) return value;
                    return toInt(value);
                });
            }
        }
        export function DirectiveFactory(): angular.IDirectiveFactory {
            let factory: angular.IDirectiveFactory = function (): angular.IDirective {
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
    }
}

module.service("$workbook", RPCalculator.Workbook.Service);
module.directive("integer", RPCalculator.Integer.DirectiveFactory());
module.directive("score", RPCalculator.Score.DirectiveFactory());
