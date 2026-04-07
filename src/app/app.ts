import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { TuiRoot } from '@taiga-ui/core';

import { AuthService } from './core/auth.service';
import { authActions } from './store/auth/auth.actions';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('reglab-chat');
  private readonly store = inject(Store);
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    this.store.dispatch(authActions.hydrate({ user: this.auth.getCurrentUser() }));
  }
}
