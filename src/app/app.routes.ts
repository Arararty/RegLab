import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { ChatsPageComponent } from './pages/chats/chats.page';
import { LoginPageComponent } from './pages/login/login.page';
import { SettingsPageComponent } from './pages/settings/settings.page';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: '', component: ChatsPageComponent, canActivate: [authGuard] },
  { path: 'user', component: SettingsPageComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
