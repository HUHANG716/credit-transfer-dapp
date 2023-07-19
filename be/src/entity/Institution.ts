import { Entity, PrimaryColumn, Column, OneToMany, ManyToOne } from "typeorm";
import { Course } from "./Course";

@Entity()
export class Institution {
  @PrimaryColumn()
  addr: string;

  @Column()
  institutionName: string;

  @OneToMany(() => Course, (courses) => courses.owner)
  courses: Course[];
}
