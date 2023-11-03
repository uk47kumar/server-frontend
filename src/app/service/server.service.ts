import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { CustomResponse } from '../interface/custom-response';
import { Server } from '../interface/server';
import { Status } from '../enum/status.enum';

@Injectable({
  providedIn: 'root',
})
export class ServerService {
  private readonly apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  // getServers(): Observable<CustomResponse> {
  //   return this.http.get<CustomResponse>(`http://localhost:8080/server/list`);
  // }

  // more reactive approach

  servers$ = <Observable<CustomResponse>>(
    this.http.get<CustomResponse>(`${this.apiUrl}/server/list`)
      .pipe(
        tap(console.log), 
        catchError(this.handleError)
      )
  );

  save$ = (server: Server) => <Observable<CustomResponse>>(
    this.http.post<CustomResponse>(`${this.apiUrl}/server/save`, server)
      .pipe(
        tap(console.log), 
        catchError(this.handleError)
      )
  );

  ping$ = (ipAddress: string) => <Observable<CustomResponse>>(
    this.http.get<CustomResponse>(`${this.apiUrl}/server/ping/${ipAddress}`)
      .pipe(
        tap(console.log), 
        catchError(this.handleError)
      )
  );

  // filter$ = (status: Status, response: CustomResponse) => <Observable<CustomResponse>>
  //   new Observable<CustomResponse>(
  //     suscriber => {
  //       console.log(response);
  //       suscriber.next(
  //         status === Status.ALL ? { ...response, message: `Servers filtered by ${status} status` } :
  //           {
  //             ...response,
  //             message: response.data.servers
  //               .filter(server => server.status === status).length > 0 ? `Servers filtered by 
  //         ${status === Status.SERVER_UP ? 'SERVER UP'
  //               : 'SERVER DOWN'} status` : `No servers of ${status} found`,
  //             data: {
  //               servers: response.data.servers
  //                 .filter(server => server.status === status)
  //             }
  //           }
  //       );
  //       suscriber.complete();
  //     }
  //   )
  //     .pipe(
  //       tap(console.log),
  //       catchError(this.handleError)
  //     );

  filter$ = (status: Status, response: CustomResponse) =>
  new Observable<CustomResponse>(subscriber => {
    console.log(response);
    let filteredData;

    if (status === Status.ALL) {
      filteredData = { ...response, message: `Servers filtered by ${status} status` };
    } else {
      const filteredServers = (response.data?.servers || []).filter(server => server.status === status);

      filteredData = {
        ...response,
        message:
          filteredServers.length > 0
            ? `Servers filtered by ${status === Status.SERVER_UP ? 'SERVER UP' : 'SERVER DOWN'} status`
            : `No servers of ${status} found`,
        data: { servers: filteredServers }
      };
    }

    subscriber.next(filteredData);
    subscriber.complete();
  }).pipe(
    tap(console.log),
    catchError(this.handleError)
  );
  
  delete$ = (serverId: number) => <Observable<CustomResponse>>(
    this.http.delete<CustomResponse>(`${this.apiUrl}/server/delete/${serverId}`)
      .pipe(
        tap(console.log), 
        catchError(this.handleError)
      )
  );

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.log(error);
    throw throwError(`An error ocured - Error code: ${error.status}`);
  }
}
