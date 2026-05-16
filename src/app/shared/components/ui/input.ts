import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'agm-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AgmInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative w-full flex flex-col gap-1">
      <!-- Label -->
      <label *ngIf="label" [for]="id" class="text-sm font-semibold text-on-surface-variant transition-colors duration-200">
        {{ label }}
        <span *ngIf="required" class="text-error">*</span>
      </label>

      <!-- Input Wrapper -->
      <div class="relative flex items-center">
        <!-- Left Icon -->
        <span *ngIf="hasLeftIcon" class="absolute left-4 text-outline z-10 flex items-center justify-center">
          <ng-content select="[iconLeft]"></ng-content>
        </span>

        <!-- Input Field -->
        <input
          [id]="id"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [value]="value"
          (input)="onInputChange($event)"
          (blur)="onBlur()"
          [ngClass]="[
            'w-full px-4 py-3 rounded-xl border transition-all duration-300 outline-none text-on-surface bg-surface-container-lowest',
            hasLeftIcon ? 'pl-11' : '',
            hasRightIcon ? 'pr-11' : '',
            error ? 'border-error focus:ring-2 focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary-fixed',
            disabled ? 'opacity-50 cursor-not-allowed bg-surface-container-low' : 'hover:border-outline'
          ]"
        />

        <!-- Right Icon / Interactive action (e.g. Eye for password) -->
        <span *ngIf="hasRightIcon" class="absolute right-4 text-outline z-10 flex items-center justify-center">
          <ng-content select="[iconRight]"></ng-content>
        </span>
      </div>

      <!-- Error Message -->
      <span *ngIf="error && errorMessage" class="text-xs text-error font-medium animate-fade-in mt-1">
        {{ errorMessage }}
      </span>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
  `]
})
export class AgmInputComponent implements ControlValueAccessor {
  @Input() id = `agm-input-${Math.random().toString(36).substring(2, 9)}`;
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() error = false;
  @Input() errorMessage = '';
  @Input() hasLeftIcon = false;
  @Input() hasRightIcon = false;
  @Input() disabled = false;

  value: any = '';

  onChange: any = () => {};
  onTouch: any = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }

  onBlur(): void {
    this.onTouch();
  }
}
