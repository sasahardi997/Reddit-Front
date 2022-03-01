import { EventEmitter, Injectable, Output } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { SignupRequestPayload } from '../signup/signup-request.payload';
import { map, Observable, tap } from 'rxjs';
import { LoginRequestPayload } from '../login/login-request.payload';
import { LoginResponse } from '../login/login-response.payload';
import { LocalStorageService } from '@rars/ngx-webstorage';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  @Output() loggedIn: EventEmitter<boolean> = new EventEmitter();
  @Output() username: EventEmitter<string> = new EventEmitter();

  refreshTokenPayload = {
    refreshToken: this.getRefreshToken(),
    username: this.getUserName()
  }

  constructor(private http: HttpClient, private localStorageService: LocalStorageService) { }

  signup(signupRequestPayload: SignupRequestPayload): Observable<any> {
    const reqHeader = new HttpHeaders(
      { 
       'Content-Type': 'application/json',
       'No-Auth': 'True',
        'responseType': 'text'
      });
    return this.http.post<string>('http://localhost:8080/api/auth/signup', signupRequestPayload, {
      headers: reqHeader
    });
  }

  login(loginRequestPayload: LoginRequestPayload): Observable<any> {
    const reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True' });
    console.log(loginRequestPayload)
    return this.http.post<LoginResponse>('http://localhost:8080/api/auth/login', loginRequestPayload, {
      headers: reqHeader
    })
      .pipe(map(data => {
        this.localStorageService.store('authenticationToken', data.authenticationToken);
        this.localStorageService.store('username', data.username);
        this.localStorageService.store('refreshToken', data.refreshToken);
        this.localStorageService.store('expiresAt', data.expiresAt);

        return true;
      }));
  }

  refreshToken() {
    const refreshTokenPayload = {
      refreshToken: this.getRefreshToken(),
      username: this.getUserName()
    }
    return this.http.post<LoginResponse>('http://localhost:8080/api/auth/refresh/token',
      refreshTokenPayload)
      .pipe(tap(response => {
        this.localStorageService.store('authenticationToken', response.authenticationToken);
        this.localStorageService.store('expiresAt', response.expiresAt);
      }));
  }

  getJwtToken() {
    return this.localStorageService.retrieve('authenticationToken');
  }

  getRefreshToken() {
    return this.localStorageService.retrieve('refreshToken');
  }

  getUserName() {
    return this.localStorageService.retrieve('username');
  }

  getExpirationTime() {
    return this.localStorageService.retrieve('expiresAt');
  }

  isLoggedIn(): boolean {
    return this.getJwtToken() != null;
  }

  logout() {
    this.http.post('http://localhost:8080/api/auth/logout', this.refreshTokenPayload,
      { responseType: 'text' })
      .subscribe(data => {
        console.log(data);
      }, (error) => {
        console.log(error);
      })
    this.localStorageService.clear('authenticationToken');
    this.localStorageService.clear('username');
    this.localStorageService.clear('refreshToken');
    this.localStorageService.clear('expiresAt');
  }
}
