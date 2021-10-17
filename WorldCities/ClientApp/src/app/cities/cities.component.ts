import { Component, Inject, OnInit, ViewChild } from '@angular/core';
//import { HttpClient, HttpParams } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { City } from './city';
import { CityService } from './city.service';
import { ApiResult } from '../base.service';
import { BaseFormComponent } from '../base.form.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthorizeService } from '../../api-authorization/authorize.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-cities',
    templateUrl: './cities.component.html',
    styleUrls: ['./cities.component.css']
})
export class CitiesComponent extends BaseFormComponent implements OnInit {
    public displayedColumns: string[] = ['id', 'name', 'lat', 'lon', 'countryName', 'delete']
    public cities: MatTableDataSource<City>;
    defaultPageIndex: number = 0;
    defaultPageSize: number = 10;
    public defaultSortColumn: string = "name";
    public defaultSortOrder: string = "asc";
    defaultFilterColumn: string = "name";
    filterQuery: string = null;
    @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: false }) sort: MatSort;
    filterTextChanged: Subject<string> = new Subject<string>();
    public isAuthenticated: Observable<boolean>;
    constructor(
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private authorizeService: AuthorizeService,
        private cityService: CityService) { super(); }
    ngOnInit() {
        this.loadData();
        this.isAuthenticated = this.authorizeService.isAuthenticated();
    }
    // debounce filter text changes
    onFilterTextChanged(filterText: string) {
        if (this.filterTextChanged.observers.length === 0) {
            this.filterTextChanged
                .pipe(debounceTime(1000), distinctUntilChanged())
                .subscribe(query => {
                    this.loadData(query);
                });
        }
        this.filterTextChanged.next(filterText);
    }
    loadData(query: string = null) {
        var pageEvent = new PageEvent();
        pageEvent.pageIndex = this.defaultPageIndex;
        pageEvent.pageSize = this.defaultPageSize;
        if (query) {
            this.filterQuery = query;
        }
        this.getData(pageEvent);
    }

    getData(event: PageEvent) {
        var sortColumn = (this.sort)
            ? this.sort.active
            : this.defaultSortColumn;
        var sortOrder = (this.sort)
            ? this.sort.direction
            : this.defaultSortOrder;
        var filterColumn = (this.filterQuery)
            ? this.defaultFilterColumn
            : null;
        var filterQuery = (this.filterQuery)
            ? this.filterQuery
            : null;
        this.cityService.getData<ApiResult<City>>(
            event.pageIndex,
            event.pageSize,
            sortColumn,
            sortOrder,
            filterColumn,
            filterQuery)
            .subscribe(result => {
                this.paginator.length = result.totalCount;
                this.paginator.pageIndex = result.pageIndex;
                this.paginator.pageSize = result.pageSize;
                this.cities = new MatTableDataSource<City>(result.data);
            }, error => console.error(error));
    }
    Delete(id: number) {
        if (confirm("Are you sure?")) {
            this.cityService
                .delete<City>(id)
                .subscribe(result => {
                    console.log("City " + id + " has been deleted.");
                    this.router.navigate(['/cities']);
                    this.loadData();
                    window.alert("The city has been eliminated!")
                }, error => console.error(error));

        }
    }
}
