import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { DataState } from './enum/data-state.enum';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { ServerService } from './service/server.service';
import { Status } from './enum/status.enum';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit{
  
  appState$!: Observable<AppState<CustomResponse>>;
  readonly DataState = DataState;
  readonly Status = Status;
  private filterSubject = new BehaviorSubject<string>('');
  filterStatus$ = this.filterSubject.asObservable();
  private dataSubject = new BehaviorSubject<CustomResponse | undefined>(undefined);
  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();
  selectedStatus: string = 'ALL';
  

  constructor(private serverService: ServerService) { }

  ngOnInit(): void {
    this.appState$ = this.serverService.servers$
      .pipe(
        map(response => {
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED_STATE, appData: response }
        }),
        startWith({ dataState: DataState.LOADING_STATE }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  pingServer(ipAddress: string): void {
    // Notify observers that we are filtering by an IP address.
    this.filterSubject.next(ipAddress);
    // Call the serverService to ping the server with the given IP address.
    this.appState$ = this.serverService.ping$(ipAddress)
      .pipe(
        map(response => {
          // Find the index of the server with the matching ID in the data.
          if(this.dataSubject.value?.data?.servers && response.data?.server){
            const index = this.dataSubject.value.data.servers.findIndex(server =>  server.id === response.data?.server?.id);
            // If the server is found in the data, update it with the response's server data.
            if(index !== -1){
              this.dataSubject.value.data.servers[index] = response.data.server;
            }
          }
          // this.notifier.onDefault(response.message);

          // Clear the filter (notifying that the filtering is complete).
          this.filterSubject.next('');
          // Return a new app state with the updated data.
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),
        // Start with the current data state (loaded or loading)
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          // Clear the filter in case of an error.
          this.filterSubject.next('');

          // this.notifier.onError(error);

           // Return an app state with an error message.
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  filterServers(status: Status): void {
    this.appState$ = this.serverService.filter$(status, this.dataSubject.value as CustomResponse)
      .pipe(
        map(response => {
          return { dataState: DataState.LOADED_STATE, appData: response };
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value as CustomResponse }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  printReport(): void {
    let dataType = 'application/vnd.ms-excel.sheet.macroEnabled.12';
    let tableSelect = document.getElementById('servers');
  
    if (tableSelect) {
      // in case printing pdf comment out the all code and uncomment the window.print() line only
      // window.print();
      // Check if tableSelect is not null
      let tableHtml = tableSelect.outerHTML.replace(/ /g, '%20');
      let downloadLink = document.createElement('a');
      document.body.appendChild(downloadLink);
      downloadLink.href = 'data:' + dataType + ', ' + tableHtml;
      downloadLink.download = 'server-report.xls';
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } else {
      // Handle the case where tableSelect is null (e.g., show an error message)
      console.error('Table element not found.');
    }
  }

}
