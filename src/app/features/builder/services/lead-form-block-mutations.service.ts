import { inject, Injectable } from '@angular/core';

import type { LeadFormBlockUpdate, LeadFormFieldConfig } from '../domain/models';
import {
  duplicateCollectionItem,
  moveCollectionItem,
  removeCollectionItem,
} from '../domain/utils/collection-update';
import type { MoveDirection } from '../stores/builder-store.types';
import { BlockConfigMergeService } from './block-config-merge.service';
import { BuilderElementIdService } from './builder-element-id.service';
import type { BlockMutationExecutor } from './block-mutation.types';

@Injectable({ providedIn: 'root' })
export class LeadFormBlockMutationsService {
  private readonly merge = inject(BlockConfigMergeService);
  private readonly ids = inject(BuilderElementIdService);

  updateLeadFormBlock(
    execute: BlockMutationExecutor,
    blockId: string,
    update: LeadFormBlockUpdate,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'leadForm') {
        return block;
      }

      return {
        ...block,
        title: update.title ?? block.title,
        description: update.description ?? block.description,
        submitText: update.submitText ?? block.submitText,
        successMessage: update.successMessage ?? block.successMessage,
        fields: update.fields ?? block.fields,
      };
    });
  }

  updateLeadFormField(
    execute: BlockMutationExecutor,
    blockId: string,
    fieldId: string,
    update: Partial<LeadFormFieldConfig>,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'leadForm') {
        return block;
      }

      const fieldIndex = block.fields.findIndex((field) => field.id === fieldId);
      const field = block.fields[fieldIndex];

      if (fieldIndex === -1 || field === undefined) {
        return block;
      }

      const nextField = this.merge.mergeRecord(field, {
        label: update.label,
        type: update.type,
        placeholder: update.placeholder,
        required: update.required,
        helpText: update.helpText,
        order: update.order,
      });

      if (nextField === field) {
        return block;
      }

      return {
        ...block,
        fields: block.fields.map((currentField, index) =>
          index === fieldIndex ? nextField : currentField,
        ),
      };
    });
  }

  addLeadFormField(execute: BlockMutationExecutor, blockId: string): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'leadForm') {
        return block;
      }

      const order = block.fields.length + 1;

      return {
        ...block,
        fields: [
          ...block.fields,
          {
            id: this.ids.create('field'),
            label: 'Новое поле',
            type: 'text',
            placeholder: 'Введите значение',
            required: false,
            helpText: 'Подсказка для посетителя.',
            order,
          },
        ],
      };
    });
  }

  duplicateLeadFormField(
    execute: BlockMutationExecutor,
    blockId: string,
    fieldId: string,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'leadForm') {
        return block;
      }

      const fieldIndex = block.fields.findIndex((field) => field.id === fieldId);
      const fields = duplicateCollectionItem(block.fields, fieldIndex, (field) => ({
        ...field,
        id: this.ids.create('field'),
      }));

      return fields === block.fields
        ? block
        : { ...block, fields: this.merge.reindexLeadFields(fields) };
    });
  }

  moveLeadFormField(
    execute: BlockMutationExecutor,
    blockId: string,
    fieldId: string,
    direction: MoveDirection,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'leadForm') {
        return block;
      }

      const currentIndex = block.fields.findIndex((field) => field.id === fieldId);
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const fields = moveCollectionItem(block.fields, currentIndex, nextIndex);

      return fields === block.fields
        ? block
        : { ...block, fields: this.merge.reindexLeadFields(fields) };
    });
  }

  removeLeadFormField(execute: BlockMutationExecutor, blockId: string, fieldId: string): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'leadForm') {
        return block;
      }

      const fieldIndex = block.fields.findIndex((field) => field.id === fieldId);
      const fields = removeCollectionItem(block.fields, fieldIndex, 1);

      return fields === block.fields
        ? block
        : { ...block, fields: this.merge.reindexLeadFields(fields) };
    });
  }
}
