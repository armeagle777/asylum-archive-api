import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { QueryTypes, Sequelize } from 'sequelize';
import { SEQUELIZE } from '../database/database.constants';
import { SearchCasesQueryDto } from './dto/search-cases-query.dto';
import { CaseDetails } from './interfaces/case-details.interface';

@Injectable()
export class CasesService {
  constructor(@Inject(SEQUELIZE) private readonly sequelize: Sequelize) {}

  async searchCases({
    query,
    limit,
    offset,
  }: SearchCasesQueryDto): Promise<Record<string, unknown>[]> {
    const likeQuery = `%${query}%`;

    return this.sequelize.query<Record<string, unknown>>(
      `
        SELECT DISTINCT
          c.case_id,
          c.application_date,
          c.input_date,
          c.contact_tel,
          c.contact_email,
          c.mul_num,
          c.case_status,
          p.personal_id,
          p.f_name_arm,
          p.l_name_arm,
          p.m_name_arm,
          p.f_name_eng,
          p.l_name_eng,
          p.m_name_eng,
          p.citizenship,
          p.doc_num,
          p.pnum,
          card.card_number
        FROM tb_case AS c
        LEFT JOIN tb_person AS p ON p.case_id = c.case_id
        LEFT JOIN tb_cards AS card ON card.personal_id = p.personal_id
        WHERE
          c.contact_tel LIKE :likeQuery
          OR c.contact_email LIKE :likeQuery
          OR c.mul_num LIKE :likeQuery
          OR p.f_name_arm LIKE :likeQuery
          OR p.l_name_arm LIKE :likeQuery
          OR p.m_name_arm LIKE :likeQuery
          OR p.f_name_eng LIKE :likeQuery
          OR p.l_name_eng LIKE :likeQuery
          OR p.m_name_eng LIKE :likeQuery
          OR CAST(p.citizenship AS CHAR) LIKE :likeQuery
          OR p.doc_num LIKE :likeQuery
          OR p.pnum LIKE :likeQuery
          OR CAST(card.card_number AS CHAR) LIKE :likeQuery
        ORDER BY c.case_id DESC
        LIMIT :limit OFFSET :offset
      `,
      {
        replacements: { likeQuery, limit, offset },
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
}
