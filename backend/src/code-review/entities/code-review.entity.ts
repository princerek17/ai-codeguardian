import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class CodeReview {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  language: string;

  @Column()
  reviewType: string;

  @Column({ type: 'text' })
  originalCode: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'jsonb' })
  issues: any;

  @Column({ type: 'text' })
  suggestedCode: string;
}
