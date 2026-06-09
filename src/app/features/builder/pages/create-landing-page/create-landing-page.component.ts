import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';

import {
  LANDING_FOOTER_OPTIONS,
  LANDING_HEADER_OPTIONS,
  LANDING_INDUSTRY_OPTIONS,
  LANDING_OFFER_LIST_OPTIONS,
  LANDING_TONE_OPTIONS,
  LANDING_WIZARD_STEPS,
} from '../../data-access/landing-wizard-options';
import type {
  CompleteLandingWizardSelection,
  LandingBlueprintItem,
  LandingFooterVariant,
  LandingHeaderVariant,
  LandingIndustry,
  LandingOfferListVariant,
  LandingOption,
  LandingTone,
  LandingWizardSelection,
  LandingWizardStep,
  LandingWizardStepId,
} from '../../domain/models';
import { BuilderStore } from '../../stores/builder.store';
import { LandingWizardPreviewComponent } from './landing-wizard-preview/landing-wizard-preview.component';

interface LandingQuestionCopy {
  readonly title: string;
  readonly description: string;
}

const REQUIRED_STEP_COUNT = 5;
const UNSELECTED_LABEL = 'Не выбрано';

@Component({
  selector: 'app-create-landing-page',
  standalone: true,
  imports: [
    LandingWizardPreviewComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    RouterLink,
  ],
  templateUrl: './create-landing-page.component.html',
  styleUrl: './create-landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateLandingPageComponent {
  private readonly builderStore = inject(BuilderStore);
  private readonly router = inject(Router);

  readonly stepDefinitions = LANDING_WIZARD_STEPS;
  readonly industryOptions = LANDING_INDUSTRY_OPTIONS;
  readonly toneOptions = LANDING_TONE_OPTIONS;
  readonly headerOptions = LANDING_HEADER_OPTIONS;
  readonly offerListOptions = LANDING_OFFER_LIST_OPTIONS;
  readonly footerOptions = LANDING_FOOTER_OPTIONS;

  readonly currentStepIndex = signal<number>(0);
  readonly selection = signal<LandingWizardSelection>({
    industry: null,
    tone: null,
    header: null,
    offerList: null,
    footer: null,
  });

  readonly currentStep = computed<LandingWizardStep>(
    () => this.stepDefinitions[this.currentStepIndex()] ?? this.stepDefinitions[0],
  );
  readonly completedStepCount = computed<number>(() => {
    const selection = this.selection();

    return [
      selection.industry,
      selection.tone,
      selection.header,
      selection.offerList,
      selection.footer,
    ].filter((value) => value !== null).length;
  });
  readonly progress = computed<number>(() =>
    Math.round((this.completedStepCount() / REQUIRED_STEP_COUNT) * 100),
  );
  readonly highestAvailableStep = computed<number>(() => {
    const selection = this.selection();
    const flags = [
      selection.industry !== null,
      selection.tone !== null,
      selection.header !== null,
      selection.offerList !== null,
      selection.footer !== null,
    ];
    const firstIncompleteIndex = flags.findIndex((isComplete) => !isComplete);

    return firstIncompleteIndex === -1
      ? this.stepDefinitions.length - 1
      : firstIncompleteIndex;
  });
  readonly canFinish = computed<boolean>(() => this.completedStepCount() === REQUIRED_STEP_COUNT);
  readonly currentStepCompleted = computed<boolean>(() => this.isStepComplete(this.currentStep().id));
  readonly currentQuestionCopy = computed<LandingQuestionCopy>(() => {
    switch (this.currentStep().id) {
      case 'industry':
        return {
          title: 'Для чего собираем лендинг',
          description: 'Ниша задаст тексты, набор секций и первый смысловой акцент.',
        };
      case 'tone':
        return {
          title: 'Какой характер у страницы',
          description: 'Тон влияет на визуальную подачу, контраст и плотность первого экрана.',
        };
      case 'header':
        return {
          title: 'Как должен работать хедер',
          description: 'Выберите верхнюю часть страницы: от чистого первого экрана до быстрой брони.',
        };
      case 'offerList':
        return {
          title: 'Как показать продукты или услуги',
          description: 'Этот блок станет основным списком предложений в середине лендинга.',
        };
      case 'footer':
        return {
          title: 'Как завершить страницу',
          description: 'Футер соберет контакты, ссылки и финальный призыв к действию.',
        };
      case 'summary':
        return {
          title: 'Черновик готов к сборке',
          description: 'Проверьте выбранную структуру и отправьте ее в конструктор.',
        };
    }
  });
  readonly blueprintItems = computed<readonly LandingBlueprintItem[]>(() => {
    const selection = this.selection();

    return [
      {
        label: 'Ниша',
        value: this.getOptionTitle(this.industryOptions, selection.industry),
        icon: 'storefront',
        completed: selection.industry !== null,
      },
      {
        label: 'Подача',
        value: this.getOptionTitle(this.toneOptions, selection.tone),
        icon: 'palette',
        completed: selection.tone !== null,
      },
      {
        label: 'Хедер',
        value: this.getOptionTitle(this.headerOptions, selection.header),
        icon: 'web_asset',
        completed: selection.header !== null,
      },
      {
        label: 'Предложения',
        value: this.getOptionTitle(this.offerListOptions, selection.offerList),
        icon: 'view_module',
        completed: selection.offerList !== null,
      },
      {
        label: 'Футер',
        value: this.getOptionTitle(this.footerOptions, selection.footer),
        icon: 'call_to_action',
        completed: selection.footer !== null,
      },
    ];
  });
  readonly previewBrandName = computed<string>(() => {
    const industry = this.selection().industry;

    return industry === null ? 'Новый лендинг' : this.getOptionTitle(this.industryOptions, industry);
  });
  readonly previewOfferName = computed<string>(() => {
    const offerList = this.selection().offerList;

    return offerList === null
      ? 'Список предложений'
      : this.getOptionTitle(this.offerListOptions, offerList);
  });

  selectIndustry(industry: LandingIndustry): void {
    this.selection.update((selection) => ({
      ...selection,
      industry,
    }));
  }

  selectTone(tone: LandingTone): void {
    this.selection.update((selection) => ({
      ...selection,
      tone,
    }));
  }

  selectHeader(header: LandingHeaderVariant): void {
    this.selection.update((selection) => ({
      ...selection,
      header,
    }));
  }

  selectOfferList(offerList: LandingOfferListVariant): void {
    this.selection.update((selection) => ({
      ...selection,
      offerList,
    }));
  }

  selectFooter(footer: LandingFooterVariant): void {
    this.selection.update((selection) => ({
      ...selection,
      footer,
    }));
  }

  isStepComplete(stepId: LandingWizardStepId): boolean {
    const selection = this.selection();

    switch (stepId) {
      case 'industry':
        return selection.industry !== null;
      case 'tone':
        return selection.tone !== null;
      case 'header':
        return selection.header !== null;
      case 'offerList':
        return selection.offerList !== null;
      case 'footer':
        return selection.footer !== null;
      case 'summary':
        return this.canFinish();
    }
  }

  isStepAccessible(stepIndex: number): boolean {
    return stepIndex <= this.highestAvailableStep();
  }

  goToStep(stepIndex: number): void {
    if (!this.isStepAccessible(stepIndex)) {
      return;
    }

    this.currentStepIndex.set(stepIndex);
  }

  previousStep(): void {
    this.currentStepIndex.update((stepIndex) => Math.max(stepIndex - 1, 0));
  }

  nextStep(): void {
    if (!this.currentStepCompleted()) {
      return;
    }

    this.currentStepIndex.update((stepIndex) =>
      Math.min(stepIndex + 1, this.stepDefinitions.length - 1),
    );
  }

  createLanding(): void {
    const completeSelection = this.getCompleteSelection();

    if (completeSelection === null) {
      return;
    }

    this.builderStore.createLandingDraft(completeSelection);
    void this.router.navigate(['/']);
  }

  private getCompleteSelection(): CompleteLandingWizardSelection | null {
    const { industry, tone, header, offerList, footer } = this.selection();

    if (
      industry === null ||
      tone === null ||
      header === null ||
      offerList === null ||
      footer === null
    ) {
      return null;
    }

    return {
      industry,
      tone,
      header,
      offerList,
      footer,
    };
  }

  private getOptionTitle<TValue extends string>(
    options: readonly LandingOption<TValue>[],
    value: TValue | null,
  ): string {
    if (value === null) {
      return UNSELECTED_LABEL;
    }

    return options.find((option) => option.id === value)?.title ?? UNSELECTED_LABEL;
  }
}
