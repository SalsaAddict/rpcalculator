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
        .when("/bos", { templateUrl: "Views/bos.html", controller: RPCalculator.Results.BOS.Controller, controllerAs: "$ctrl" })
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
    export const maxJudges: number = 7;
    export const maxCompetitors: number = 8;
    export const textPattern: string = "(^[\\w\\s-]+$)";
    export const numberPattern: string = "(^\\d+$)";
    export const defaultWorkbookTitle: string = "Untitled Workbook";
    export const defaultWorksheetTitle: string = "Untitled Worksheet";
    export interface IRootScopeService extends angular.IRootScopeService { textPattern: string; numberPattern: string; vclass: Function; }
    export interface IStorageService extends angular.storage.IStorageService { workbook: IWorkbook; }
    export interface IWorkbook { title: string; worksheets: IWorksheet[]; }
    export interface IWorksheet { title: string; judges: IJudge[]; competitors: ICompetitor[]; top?: number; }
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
    export namespace Menu {
        export class Controller implements angular.IController {
            static $inject: string[] = ["$workbook", "$location", "$window"];
            constructor(
                private $workbook: Workbook.Service,
                private $location: angular.ILocationService,
                private $window: angular.IWindowService) { }
            private _collapsed: boolean = true;
            public get collapsed(): boolean { return this._collapsed; }
            public toggle($event?: angular.IAngularEvent, state?: boolean): void {
                if ($event) { $event.preventDefault(); event.stopPropagation(); }
                this._collapsed = ifBlank(state, !this._collapsed);
            }
            public go(path: string, $event: angular.IAngularEvent): void { this.toggle($event); this.$location.path(path); }
            public download($event: angular.IAngularEvent): void {
                this.toggle($event, true);
                let link: HTMLAnchorElement = document.createElement("a");
                link.href = "data:text/json;charset=utf-8, " + encodeURIComponent(angular.toJson(this.$workbook.workbook, false));
                link.download = ifBlank(this.$workbook.workbook.title, defaultWorkbookTitle) + ".json";
                link.click();
            }
            public upload($event: angular.IAngularEvent): void {
                this.toggle($event, true);
                let input = document.getElementById("upload") as HTMLInputElement;
                input.click();
            }
            public example($event: angular.IAngularEvent): void {
                this.toggle($event, true);
                if (!this.$window.confirm("The current workbook will be overwritten. Are you sure you want to continue?")) return;
                this.$workbook.loadExample().then((): void => { this.$location.path("/workbook"); });
            }
            public $postLink(): void { }
        }
    }
    export namespace Workbook {
        export class Service {
            static $inject: string[] = ["$localStorage", "$location", "$http", "$q"];
            constructor(
                private $localStorage: IStorageService,
                private $location: angular.ILocationService,
                private $http: angular.IHttpService,
                private $q: angular.IQService) {
                if (angular.isUndefined($localStorage.workbook)) this.loadExample();
            }
            public go(path: string = "/workbook", index?: number): void {
                if (index >= 0) path += "/" + index;
                this.$location.path(path);
            }
            public loadExample(): angular.IPromise<void> {
                return this.$http.get("example.json").then((response: angular.IHttpPromiseCallbackArg<IWorkbook>): void => {
                    this.$localStorage.workbook = response.data;
                });
            }
            public get workbook(): IWorkbook {
                return ifBlank(this.$localStorage.workbook, { title: null, worksheets: [] });
            }
            public set workbook(workbook: IWorkbook) { this.$localStorage.workbook = workbook; }
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
            static $inject: string[] = ["$workbook", "$window"];
            constructor(private $workbook: Service, private $window: angular.IWindowService) { }
            public get defaultWorkbookTitle(): string { return defaultWorkbookTitle; }
            public get defaultWorksheetTitle(): string { return defaultWorksheetTitle; }
            public get title(): string { return this.$workbook.title; }
            public set title(title: string) { this.$workbook.title = title; }
            public get worksheets(): IWorksheet[] { return this.$workbook.worksheets; }
            public add(): void { this.worksheets.push({ title: null, judges: [], competitors: [] }); }
            public remove(index: number): void {
                if (!this.$window.confirm("Are you sure you want to delete this worksheet?")) return;
                this.worksheets.splice(index, 1);
            }
            public moveUp(index: number): void { swapUp(this.worksheets, index); }
            public moveDown(index: number): void { swapDown(this.worksheets, index); }
            public copy(index: number): void {
                let copy: IWorksheet = angular.copy(this.worksheets[index]);
                copy.title = ifBlank(copy.title, defaultWorksheetTitle) + " (Copy)";
                this.worksheets.push(copy);
                swap(this.worksheets, this.worksheets.indexOf(copy), index + 1);
            }
        }
    }
    export namespace Worksheet {
        export abstract class Controller {
            static $inject: string[] = ["$scope", "$workbook", "$route", "$routeParams", "$window", "$filter"];
            constructor(
                protected $scope: angular.IScope,
                protected $workbook: Workbook.Service,
                protected $route: angular.route.IRouteService,
                protected $routeParams: angular.route.IRouteParamsService,
                protected $window: angular.IWindowService,
                protected $filter: angular.IFilterService) {
                if (angular.isUndefined(this.index) || angular.isUndefined(this.$workbook.worksheets[this.index])) this.$workbook.go();
            }
            public get form(): angular.IFormController { return this.$scope["form"]; }
            public get index(): number { return toInt(this.$routeParams["index"]); }
            public get title(): string { return ifBlank(this.worksheet.title, defaultWorksheetTitle); }
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
            public get tops(): number[] { return this.$filter("limitTo")([1, 2, 3, 4, 5, 6, 7, 8], this.competitors.length); }
            public get top(): number {
                if (!(this.worksheet.top >= 1 && this.worksheet.top <= this.competitors.length)) {
                    this.worksheet.top = (this.competitors.length > 3) ? 3 : this.competitors.length;
                }
                return this.worksheet.top;
            }
            public set top(top: number) { this.worksheet.top = top; }
            public setTab(tab: string, $event: angular.IAngularEvent): void {
                $event.preventDefault();
                $event.stopPropagation();
                if (this.tabs.indexOf(tab) > 0) this.calculate();
                this.tab = tab;
            }
            public get tabIndex(): number { return this.tabs.indexOf(this.tab); }
            public get validateJudges(): boolean { return this.$workbook.validateJudges(this.judges); }
            public get validateCompetitors(): boolean { return this.$workbook.validateCompetitors(this.competitors); }
            public get templateUrl(): string {
                if (!this.validateJudges) return "Views/setup.html";
                if (!this.validateCompetitors) return "Views/setup.html";
                return "Views/" + this.tab.toLowerCase() + ".html";
            }
            public get message(): string {
                if (this.form.$error.required) return "Each judge must rank every competitor";
                if (this.form.$error.parse || this.form.$error.min || this.form.$error.max) return "Each score must be a numeric rank between 1 and " + this.competitors.length;
                if (this.form.$error.duplicate) return "Competitors cannot be tied by any judge";
            }
            public calculate(): void {
                const majority: number = Math.ceil(this.worksheet.judges.length / 2);
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
                for (let i: number = 0; i < this.competitors.length * 2; i++) {
                    predicates.push(function (competitor: ICompetitor): number { return competitor.tally[i]; });
                }
                this.$filter("orderBy")(this.competitors, predicates)
                    .forEach((competitor: ICompetitor, index: number): void => {
                        competitor.rank = index + 1;
                    });
            }
            public copy(): void {
                let copy: IWorksheet = {
                    title: this.worksheet.title + " (Copy)",
                    judges: angular.copy(this.judges),
                    competitors: []
                }
                this.$filter("orderBy")(this.$filter("limitTo")(this.$filter("orderBy")(this.competitors, "rank"), this.top), "id")
                    .forEach((competitor: ICompetitor): void => {
                        copy.competitors.push({ id: competitor.id, name: competitor.name, scores: [] });
                    });
                this.$workbook.worksheets.push(copy);
                this.$workbook.go("/worksheets", this.$workbook.worksheets.indexOf(copy));
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
            public name(c: number = this.c, j: number = this.j): string { return "c" + c + "j" + j; }
            public get tabIndex(): number { return (this.j * this.worksheet.competitors.length) + (this.c + 1); }
            public get value(): any { return this.worksheet.competitors[this.c].scores[this.j]; }
            public set value(value: any) { this.worksheet.competitors[this.c].scores[this.j] = value; }
            public get ngClass(): any { return { "is-valid": this.ngModel.$valid, "is-invalid": this.ngModel.$invalid }; }
            public form: angular.IFormController;
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
                this.ngModel.$viewChangeListeners.push((): void => {
                    for (let i: number = 0; i < this.c; i++) {
                        let ngModel: angular.INgModelController = this.form[this.name(i, this.j)];
                        ngModel.$validate();
                    }
                    if (this.ngModel.$valid) {
                        let nj: number = (this.c + 1 < this.worksheet.competitors.length) ? this.j : (this.j + 1) % this.worksheet.judges.length;
                        let nc: number = (this.c + 1) % this.worksheet.competitors.length;
                        let name: string = this.name(nc, nj);
                        let input: HTMLInputElement = document.getElementsByName(name)[0] as HTMLInputElement;
                        input.focus();
                        input.select();
                    }
                });
            }
        }
        export function DirectiveFactory(): angular.IDirectiveFactory {
            let factory: angular.IDirectiveFactory = function (): angular.IDirective {
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
                protected $filter: angular.IFilterService) {
                super($scope, $workbook, $route, $routeParams, $window, $filter);
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
    export namespace Upload {
        export class Controller implements angular.IController {
            static $inject: string[] = ["$scope", "$element", "$workbook", "$location", "$window"];
            constructor(
                private $scope: angular.IScope,
                private $element: angular.IAugmentedJQuery,
                private $workbook: Workbook.Service,
                private $location: angular.ILocationService,
                private $window: angular.IWindowService) { }
            public onChange = (event: JQueryEventObject): void => {
                if (!this.$window.confirm("The current workbook will be overwritten. Are you sure you want to continue?")) return;
                let input = event.target as HTMLInputElement;
                if (!input.files.length) return;
                let reader: FileReader = new FileReader();
                reader.onload = () => {
                    this.$scope.$apply((): void => {
                        this.$workbook.workbook = angular.fromJson(reader.result);
                        this.$location.path("/workbook");
                    });
                };
                reader.readAsText(input.files[0]);
            }
            public $postLink(): void {
                this.$element.bind("change", this.onChange);
            }
        }
        export function DirectiveFactory(): angular.IDirectiveFactory {
            let factory: angular.IDirectiveFactory = function (): angular.IDirective {
                return { restrict: "A", scope: false, controller: Controller };
            };
            return factory;
        }
    }
}

namespace RPCalculator {
    "use strict";
    export namespace Results {
        export namespace BOS {
            export class Controller {

            }
        }
    }
}

module.service("$workbook", RPCalculator.Workbook.Service);
module.controller("menuController", RPCalculator.Menu.Controller);
module.directive("integer", RPCalculator.Integer.DirectiveFactory());
module.directive("score", RPCalculator.Score.DirectiveFactory());
module.directive("upload", RPCalculator.Upload.DirectiveFactory());
