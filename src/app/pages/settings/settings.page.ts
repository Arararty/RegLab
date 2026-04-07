import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TuiButton } from '@taiga-ui/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';

import { authActions } from '../../store/auth/auth.actions';
import { selectAuthUser } from '../../store/auth/auth.selectors';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TuiButton, TuiBadge, TuiChip],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPageComponent {
  private readonly store = inject(Store);

  readonly user$ = this.store.select(selectAuthUser);

  logout(): void {
    this.store.dispatch(authActions.logoutRequested());
  }
}
