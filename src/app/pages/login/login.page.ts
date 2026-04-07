import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TuiButton, TuiInput, TuiTextfield } from '@taiga-ui/core';
import { TuiChip } from '@taiga-ui/kit';

import { authActions } from '../../store/auth/auth.actions';
import { selectAuthError, selectAuthLoginPending } from '../../store/auth/auth.selectors';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TuiTextfield, TuiInput, TuiButton, TuiChip],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  readonly error$ = this.store.select(selectAuthError);
  readonly loginPending$ = this.store.select(selectAuthLoginPending);

  readonly form = this.fb.nonNullable.group({
    login: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(3)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { login, password } = this.form.getRawValue();
    this.store.dispatch(authActions.clearError());
    this.store.dispatch(authActions.loginSubmitted({ login, password }));
  }
}
