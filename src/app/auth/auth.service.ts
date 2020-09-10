import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { map, catchError, tap } from 'rxjs/operators';
import { throwError, Subject, BehaviorSubject } from 'rxjs';
import { User } from './user.model';
import { Router } from '@angular/router';

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  user = new BehaviorSubject<User>(null);
  private tokenExpirationTimer: any;

  constructor(private http: HttpClient,
    private router: Router) {}

  signup(email: string, password: string) {
    return this.http
      .post<AuthResponseData>(
        'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyBj3-r700Pvlyf0eVLR6Y1bAOXWK6s1efQ',
        {
          email: email,
          password: password,
          returnSecureToken: true,
        }
      )
      .pipe(catchError(this.handleError), tap(
        resData => {
          this.handleAuthentication(resData.email,
            resData.localId,
            resData.idToken,
            +resData.expiresIn);
        }
      ));
  }

  login(email, password) {
    return this.http
      .post<AuthResponseData>(
        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBj3-r700Pvlyf0eVLR6Y1bAOXWK6s1efQ',
        {
          email: email,
          password: password,
          returnSecureToken: true,
        }
      )
      .pipe(catchError(this.handleError), tap(
        resData => {
          this.handleAuthentication(resData.email,
            resData.localId,
            resData.idToken,
            +resData.expiresIn);
        }
      ));
  }

  logout(){
    this.user.next(null);
    this.router.navigate(['/auth']);
    localStorage.removeItem('userData');
    if (this.tokenExpirationTimer){
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;
  }

  private handleError(errorRes: HttpErrorResponse) {
    let errorMessage = 'An unknown error occured';
    if (!errorRes.error || !errorRes.error.error) {
      return throwError(errorMessage);
    }
    switch (errorRes.error.error.message) {
      case 'EMAIL_EXISTS':
        errorMessage = 'This Email Exists';
        break;
      case 'EMAIL_NOT_FOUND':
        errorMessage = 'This Email Does Not Exist';
        break;
      case 'INVALID_PASSWORD':
        errorMessage = 'This Password is not Correct';
        break;
    }
    return throwError(errorMessage);
  }

  private handleAuthentication(email: string, userId: string, token: string,
    expiresIn : number) {
        const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
        const user = new User(email,
        userId,
        token,
        expirationDate
        );
        this.autoLogout(expiresIn * 1000);
        this.user.next(user);
   localStorage.setItem('userData',JSON.stringify(user));
    }

  autoLogin(){
    const userData: {
      email:string;
      id: string;
      _token: string;
      _tokenExpirationDate : string;
    } = JSON.parse(localStorage.getItem('userData'));
    if(!userData){
      return;
    }

    const loadedUser = new User(userData.email,
      userData.id, userData._token,new Date(userData._tokenExpirationDate));

    if(loadedUser.token){
      this.user.next(loadedUser);
      const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
      this.autoLogout(expirationDuration);
    }
  }

  autoLogout(expirationDuration: number){
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }
}
