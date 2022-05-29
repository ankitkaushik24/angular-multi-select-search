/* eslint-disable no-underscore-dangle */
import { FocusMonitor } from '@angular/cdk/a11y';
import {
  Directive,
  ElementRef,
  Host,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { filter, Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[appSelectSearch]',
})
export class SelectSearchDirective implements OnInit, OnDestroy {

  private destroy$ = new Subject();

  @Input() filterFn = (option: MatOption<any>, inputValue: string) => !option.viewValue
  ?.toLowerCase()
  .includes(inputValue?.toLowerCase());

  get inputElement(): HTMLInputElement {
    return this.hostElRef.nativeElement as HTMLInputElement;
  }

  constructor(
    private hostElRef: ElementRef,
    private focusMonitor: FocusMonitor,
    private select: MatSelect
  ) {}

  /**
   * @description Whenever we receive any input in our search input
   * it queries all the options and disables and hide all the unmatched items.
   */
  @HostListener('input')
  onInput() {
    this.select.options.forEach((option) => {
      const isFiltered = this.filterFn(option, this.inputElement.value);

      option.disabled = isFiltered;
      option._getHostElement().toggleAttribute('hidden', isFiltered);
    });
  }

  /**
   * @description stop the Space key event propagation further to prevent 
   * the default behaviour of Space key of selecting 
   * the focussed option in case of mat-select component
   * @param event KeyDown event for Space key
   */

  @HostListener('keydown.space', ['$event'])
  stopSpaceKeyDownPropagation(event: KeyboardEvent) {
    event.stopPropagation();
  }

  ngOnInit(): void {
    this.select.openedChange
      .pipe(takeUntil(this.destroy$))
      .subscribe((isOpened) => {
        if (isOpened) { // on open
          this.focusMonitor.focusVia(this.inputElement, 'keyboard');
        } else { // on close
          this.inputElement.value = '';
          this.inputElement.dispatchEvent(new Event('input'));
        }
      });

    // while user selects any option
    // selects the feeded text for the user
    // to make any update directly inside the input
    this.select.optionSelectionChanges
      .pipe(
        filter((e) => e.isUserInput),
        takeUntil(this.destroy$)
      )
      .subscribe((e) => {
        this.inputElement.select();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
