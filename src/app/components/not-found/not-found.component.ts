import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppConstants } from '../../utils/constants';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {
  protected readonly urls = AppConstants.AppUrls;
}
