import { Entity, PrimaryColumn, Column, ManyToOne, ManyToMany, JoinColumn, JoinTable } from "typeorm";
import { Institution } from "./Institution";

@Entity()
export class Course {
  @PrimaryColumn()
  id: number;

  @Column()
  courseName: string;

  @Column()
  courseFileHash: string;

  @Column() // New column for Institution's primary key
  owner: string;

  @ManyToOne(() => Institution, (institution) => institution.courses)
  @JoinColumn({ name: "ownerId" }) // Map the relation to ownerId column
  ownerInstitution: Institution;

  @ManyToMany(() => Course, (courses) => courses.recognized)
  @JoinTable({
    name: "recognizers_recognized",
    joinColumn: {
      name: "recognizer",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "recognized",
      referencedColumnName: "id",
    },
  })
  recognizer: Course[];

  @ManyToMany(() => Course, (courses) => courses.recognizer)
  recognized: Course[];
}
