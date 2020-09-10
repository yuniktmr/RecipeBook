import { Component, OnInit, EventEmitter, Output, OnDestroy } from '@angular/core';
import { DataStorageService } from '../shared/data-storage.service';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  private userSub : Subscription;

  constructor(private dataStorageService: DataStorageService,
    private authService: AuthService) { }

  ngOnInit(): void {
    this.userSub = this.authService.user.subscribe(user =>
   { this.isAuthenticated = !!user;});
  }

  onSaveData(){
    this.dataStorageService.storeRecipe();
  }

  onFetchData(){
    this.dataStorageService.fetchRecipes().subscribe();
  }

  onLogOut(){
    this.authService.logout();
  }

  ngOnDestroy(){
    this.userSub.unsubscribe();
  }


}
