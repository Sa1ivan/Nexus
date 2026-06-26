import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';

import {
  LANDING_ACCENT_OPTIONS,
  LANDING_DENSITY_OPTIONS,
  LANDING_FOOTER_OPTIONS,
  LANDING_FOOTER_OPTIONS_BY_INDUSTRY,
  LANDING_FONT_OPTIONS,
  LANDING_HEADER_OPTIONS,
  LANDING_HEADER_OPTIONS_BY_INDUSTRY,
  LANDING_INDUSTRY_RECOMMENDATIONS,
  LANDING_INDUSTRY_OPTIONS,
  LANDING_OFFER_LIST_OPTIONS,
  LANDING_OFFER_LIST_OPTIONS_BY_INDUSTRY,
  LANDING_TEMPLATE_STYLE_OPTIONS,
  LANDING_TONE_OPTIONS,
  LANDING_WIZARD_STEPS,
} from '../../data-access/landing-wizard-options';
import type {
  CompleteLandingWizardSelection,
  LandingBlueprintItem,
  LandingAccentColor,
  LandingDensity,
  LandingDesignOption,
  LandingDesignSettings,
  LandingFooterVariant,
  LandingFontPairing,
  LandingHeaderVariant,
  LandingIndustry,
  LandingOfferListVariant,
  LandingOption,
  LandingTemplateStyle,
  LandingTone,
  LandingWizardSelection,
  LandingWizardStep,
  LandingWizardStepId,
} from '../../domain/models';
import { DEFAULT_LANDING_DESIGN_SETTINGS } from '../../domain/models';
import { BuilderStore } from '../../stores/builder.store';
import { LandingWizardPreviewComponent } from './landing-wizard-preview/landing-wizard-preview.component';

interface LandingQuestionCopy {
  readonly title: string;
  readonly description: string;
}

const REQUIRED_STEP_COUNT = 5;
const UNSELECTED_LABEL = 'Не выбрано';
const DEFAULT_PREVIEW_INDUSTRY: LandingIndustry = 'product';

type LandingChoiceId =
  | LandingIndustry
  | LandingTone
  | LandingHeaderVariant
  | LandingOfferListVariant
  | LandingFooterVariant
  | LandingAccentColor
  | LandingFontPairing
  | LandingDensity
  | LandingTemplateStyle;

@Component({
  selector: 'app-create-landing-page',
  standalone: true,
  imports: [
    LandingWizardPreviewComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
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
  readonly accentOptions = LANDING_ACCENT_OPTIONS;
  readonly fontOptions = LANDING_FONT_OPTIONS;
  readonly densityOptions = LANDING_DENSITY_OPTIONS;
  readonly templateStyleOptions = LANDING_TEMPLATE_STYLE_OPTIONS;

  readonly currentStepIndex = signal<number>(0);
  readonly isPreviewOpen = signal<boolean>(false);
  readonly design = signal<LandingDesignSettings>(DEFAULT_LANDING_DESIGN_SETTINGS);
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
  readonly currentIndustry = computed<LandingIndustry | null>(() => this.selection().industry);
  readonly industryRecommendation = computed(
    () =>
      LANDING_INDUSTRY_RECOMMENDATIONS[this.currentIndustry() ?? DEFAULT_PREVIEW_INDUSTRY],
  );
  readonly headerOptionsForIndustry = computed<readonly LandingOption<LandingHeaderVariant>[]>(
    () => {
      const industry = this.currentIndustry();

      return this.getOptionsByIds(
        this.headerOptions,
        industry === null
          ? this.headerOptions.map((option) => option.id)
          : LANDING_HEADER_OPTIONS_BY_INDUSTRY[industry],
      );
    },
  );
  readonly offerListOptionsForIndustry = computed<
    readonly LandingOption<LandingOfferListVariant>[]
  >(() => {
    const industry = this.currentIndustry();

    return this.getOptionsByIds(
      this.offerListOptions,
      industry === null
        ? this.offerListOptions.map((option) => option.id)
        : LANDING_OFFER_LIST_OPTIONS_BY_INDUSTRY[industry],
    );
  });
  readonly footerOptionsForIndustry = computed<readonly LandingOption<LandingFooterVariant>[]>(
    () => {
      const industry = this.currentIndustry();

      return this.getOptionsByIds(
        this.footerOptions,
        industry === null
          ? this.footerOptions.map((option) => option.id)
          : LANDING_FOOTER_OPTIONS_BY_INDUSTRY[industry],
      );
    },
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
    const design = this.design();

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
      {
        label: 'Дизайн',
        value: `${this.getDesignOptionTitle(
          this.templateStyleOptions,
          design.templateStyle,
        )} / ${this.getDesignOptionTitle(this.fontOptions, design.fontPairing)}`,
        icon: 'tune',
        completed: true,
      },
    ];
  });
  readonly previewSelection = computed<CompleteLandingWizardSelection>(() => {
    const selection = this.selection();
    const recommendation = this.industryRecommendation();

    return {
      industry: selection.industry ?? DEFAULT_PREVIEW_INDUSTRY,
      tone: selection.tone ?? recommendation.tone,
      header: selection.header ?? recommendation.header,
      offerList: selection.offerList ?? recommendation.offerList,
      footer: selection.footer ?? recommendation.footer,
      design: this.design(),
    };
  });
  readonly previewBrandName = computed<string>(() => {
    const industry = this.selection().industry;

    return industry === null ? 'Новый лендинг' : this.getOptionTitle(this.industryOptions, industry);
  });
  readonly previewTitle = computed<string>(() => this.getPreviewHeroTitle(this.previewSelection().industry));
  readonly previewOfferName = computed<string>(() => {
    const offerList = this.previewSelection().offerList;

    return this.getOptionTitle(this.offerListOptions, offerList);
  });
  readonly editorLabel = computed<string>(() => {
    switch (this.currentStep().id) {
      case 'industry':
        return 'Основа';
      case 'tone':
        return 'Подача';
      case 'header':
        return 'Первый экран';
      case 'offerList':
        return 'Список';
      case 'footer':
        return 'Финал';
      case 'summary':
        return 'Итог';
    }
  });

  selectIndustry(industry: LandingIndustry): void {
    const recommendation = LANDING_INDUSTRY_RECOMMENDATIONS[industry];

    this.design.set(recommendation.design);
    this.selection.update((selection) => ({
      ...selection,
      industry,
      header: this.keepAllowedSelection(
        selection.header,
        LANDING_HEADER_OPTIONS_BY_INDUSTRY[industry],
      ),
      offerList: this.keepAllowedSelection(
        selection.offerList,
        LANDING_OFFER_LIST_OPTIONS_BY_INDUSTRY[industry],
      ),
      footer: this.keepAllowedSelection(
        selection.footer,
        LANDING_FOOTER_OPTIONS_BY_INDUSTRY[industry],
      ),
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

  selectAccentColor(accentColor: LandingAccentColor): void {
    this.design.update((design) => ({
      ...design,
      accentColor,
    }));
  }

  selectFontPairing(fontPairing: LandingFontPairing): void {
    this.design.update((design) => ({
      ...design,
      fontPairing,
    }));
  }

  selectDensity(density: LandingDensity): void {
    this.design.update((design) => ({
      ...design,
      density,
    }));
  }

  selectTemplateStyle(templateStyle: LandingTemplateStyle): void {
    this.design.update((design) => ({
      ...design,
      templateStyle,
    }));
  }

  openPreview(): void {
    this.isPreviewOpen.set(true);
  }

  closePreview(): void {
    this.isPreviewOpen.set(false);
  }

  isRecommendedOption(optionId: LandingChoiceId): boolean {
    const recommendation = this.industryRecommendation();

    switch (this.currentStep().id) {
      case 'tone':
        return optionId === recommendation.tone;
      case 'header':
        return optionId === recommendation.header;
      case 'offerList':
        return optionId === recommendation.offerList;
      case 'footer':
        return optionId === recommendation.footer;
      case 'industry':
      case 'summary':
        return false;
    }
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
      design: this.design(),
    };
  }

  private getOptionsByIds<TValue extends string>(
    options: readonly LandingOption<TValue>[],
    ids: readonly TValue[],
  ): readonly LandingOption<TValue>[] {
    const optionById = new Map<TValue, LandingOption<TValue>>(
      options.map((option) => [option.id, option]),
    );

    return ids
      .map((id) => optionById.get(id))
      .filter((option): option is LandingOption<TValue> => option !== undefined);
  }

  private keepAllowedSelection<TValue extends string>(
    value: TValue | null,
    allowedValues: readonly TValue[],
  ): TValue | null {
    if (value === null) {
      return null;
    }

    return allowedValues.includes(value) ? value : null;
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

  private getDesignOptionTitle<TValue extends string>(
    options: readonly LandingDesignOption<TValue>[],
    value: TValue,
  ): string {
    return options.find((option) => option.id === value)?.title ?? UNSELECTED_LABEL;
  }

  private getPreviewHeroTitle(industry: LandingIndustry): string {
    switch (industry) {
      case 'restaurant':
        return 'Вечер с живой атмосферой и быстрой бронью';
      case 'hotel':
        return 'Отель, где легко выбрать номер и даты';
      case 'beauty':
        return 'Запись на услугу без лишних шагов';
      case 'product':
        return 'Продукт с понятной ценностью на первом экране';
      case 'education':
        return 'Курс с программой, практикой и заявкой';
    }
  }
}
