import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LocalizePipe } from '../../pipes/localize.pipe';

let uid = 0;

@Component({
  selector: 'app-check',
  standalone: true,
  template: `
  <div class="check">
    <div class="round">
      <input
        type="checkbox"
        [id]="id"
        [checked]="checked"
        (change)="onChange($event)"
      />
      <label [for]="id"></label>
    </div>
    <span class="check__label">{{ label|localize }}</span>
  </div>
  `,
  styleUrls: ['./check.component.scss'],
  imports:[LocalizePipe]
})
export class CheckComponent {
  @Input() label = '';
  @Input() checked = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  id = `chk-${++uid}`;
  onChange(e: Event) {
    this.checkedChange.emit((e.target as HTMLInputElement).checked);
  }
}
