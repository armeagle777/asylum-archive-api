import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryTypes, Sequelize } from 'sequelize';
import { SEQUELIZE } from '../database/database.constants';
import { SearchCasesQueryDto } from './dto/search-cases-query.dto';
import { CaseDetails } from './interfaces/case-details.interface';

@Injectable()
export class CasesService {
  constructor(@Inject(SEQUELIZE) private readonly sequelize: Sequelize) {}

  async searchCases({
    limit,
    offset,
    ...filters
  }: SearchCasesQueryDto): Promise<Record<string, unknown>[]> {
    const { whereClause, replacements } = this.buildSearchWhereClause(filters);

    return this.sequelize.query<Record<string, unknown>>(
      `
        SELECT DISTINCT
          c.case_id,
          c.application_date,
          c.input_date,
          c.contact_tel,
          c.contact_email,
          c.mul_num,
          c.case_status
        FROM tb_case AS c
        LEFT JOIN tb_person AS p ON p.case_id = c.case_id
        LEFT JOIN tb_cards AS card ON card.personal_id = p.personal_id
        WHERE ${whereClause}
        ORDER BY c.case_id DESC
        LIMIT :limit OFFSET :offset
      `,
      {
        replacements: { ...replacements, limit, offset },
        type: QueryTypes.SELECT,
      },
    );
  }

  async getCaseDetails(caseId: number): Promise<CaseDetails> {
    const [caseRecord, persons, cards] = await Promise.all([
      this.getCase(caseId),
      this.getPersons(caseId),
      this.getCards(caseId),
    ]);

    if (!caseRecord) {
      throw new NotFoundException(`Case ${caseId} was not found`);
    }

    return {
      case: caseRecord,
      persons,
      cards,
    };
  }

  private async getCase(
    caseId: number,
  ): Promise<Record<string, unknown> | undefined> {
    const records = await this.sequelize.query<Record<string, unknown>>(
      `
        SELECT *
        FROM tb_case
        WHERE case_id = :caseId
        LIMIT 1
      `,
      {
        replacements: { caseId },
        type: QueryTypes.SELECT,
      },
    );

    return records[0];
  }

  private getPersons(caseId: number): Promise<Record<string, unknown>[]> {
    return this.sequelize.query<Record<string, unknown>>(
      `
        SELECT *
        FROM tb_person
        WHERE case_id = :caseId
        ORDER BY personal_id ASC
      `,
      {
        replacements: { caseId },
        type: QueryTypes.SELECT,
      },
    );
  }

  private getCards(caseId: number): Promise<Record<string, unknown>[]> {
    return this.sequelize.query<Record<string, unknown>>(
      `
        SELECT card.*
        FROM tb_cards AS card
        INNER JOIN tb_person AS p ON p.personal_id = card.personal_id
        WHERE p.case_id = :caseId
        ORDER BY card.card_id ASC
      `,
      {
        replacements: { caseId },
        type: QueryTypes.SELECT,
      },
    );
  }

  private buildSearchWhereClause(
    filters: Omit<SearchCasesQueryDto, 'limit' | 'offset'>,
  ): { whereClause: string; replacements: Record<string, string> } {
    const clauses: string[] = [];
    const replacements: Record<string, string> = {};

    this.addLikeFilter(
      clauses,
      replacements,
      'contactTel',
      filters.contactTel,
      ['c.contact_tel'],
    );
    this.addLikeFilter(
      clauses,
      replacements,
      'contactEmail',
      filters.contactEmail,
      ['c.contact_email'],
    );
    this.addLikeFilter(clauses, replacements, 'mulNum', filters.mulNum, [
      'c.mul_num',
    ]);
    this.addLikeFilter(clauses, replacements, 'firstName', filters.firstName, [
      'p.f_name_arm',
      'p.f_name_eng',
    ]);
    this.addLikeFilter(clauses, replacements, 'lastName', filters.lastName, [
      'p.l_name_arm',
      'p.l_name_eng',
    ]);
    this.addLikeFilter(
      clauses,
      replacements,
      'middleName',
      filters.middleName,
      ['p.m_name_arm', 'p.m_name_eng'],
    );
    this.addLikeFilter(
      clauses,
      replacements,
      'citizenship',
      filters.citizenship,
      ['CAST(p.citizenship AS CHAR)'],
    );
    this.addLikeFilter(clauses, replacements, 'docNum', filters.docNum, [
      'p.doc_num',
    ]);
    this.addLikeFilter(clauses, replacements, 'pnum', filters.pnum, ['p.pnum']);
    this.addLikeFilter(
      clauses,
      replacements,
      'cardNumber',
      filters.cardNumber,
      ['CAST(card.card_number AS CHAR)'],
    );

    if (clauses.length === 0) {
      throw new BadRequestException('At least one search filter is required');
    }

    return {
      whereClause: clauses.join(' AND '),
      replacements,
    };
  }

  private addLikeFilter(
    clauses: string[],
    replacements: Record<string, string>,
    parameterName: string,
    value: string | undefined,
    columns: string[],
  ): void {
    const normalizedValue = value?.trim();

    if (!normalizedValue) {
      return;
    }

    replacements[parameterName] = `%${normalizedValue}%`;
    clauses.push(
      `(${columns
        .map((column) => `${column} LIKE :${parameterName}`)
        .join(' OR ')})`,
    );
  }
}
