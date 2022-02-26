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
    @Host() private select: MatSelect,
    private hostElRef: ElementRef,
    private focusMonitor: FocusMonitor
  ) {}

  @HostListener('input')
  onInput() {
    this.select.options.forEach((option) => {
      option
        ._getHostElement()
        .toggleAttribute(
          'hidden',
          this.filterFn(option, this.inputElement.value)
        );
    });
  }

  ngOnInit(): void {
    this.select.openedChange
      .pipe(takeUntil(this.destroy$))
      .subscribe((isOpened) => {
        if (isOpened) {
          this.focusMonitor.focusVia(this.inputElement, 'keyboard');
        } else {
          this.inputElement.value = '';
          this.inputElement.dispatchEvent(new Event('input'));
        }
      });

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
