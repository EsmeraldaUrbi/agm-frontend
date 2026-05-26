import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { BRANDING } from './core/config/branding.config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal(BRANDING.shortName);
  private titleService = inject(Title);

  ngOnInit() {
    this.titleService.setTitle(`${BRANDING.shortName} - ${BRANDING.fullName}`);
  }
}

