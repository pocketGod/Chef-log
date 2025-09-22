import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styleUrls: ['./loader.component.scss'],
  template:'<span class="loader"></span>'
})
export class LoaderComponent {}