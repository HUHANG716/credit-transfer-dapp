import React from "react";

type Props = {
  data: any;
  header: any;
  secondData?: any;
  emptyPlaceholder: string;
};

const SelectTable = ({ emptyPlaceholder, data, header, secondData = [] }: Props) => {
  return (
    <table>
      {data?.length !== 0 ? (
        <thead
          style={{
            fontSize: "14px",
          }}>
          {header.map((head: any) => (
            <th>{head}</th>
          ))}
        </thead>
      ) : (
        <h4
          style={{
            color: "red",
            textAlign: "center",
            padding: "0 20px",
          }}>
          {emptyPlaceholder}
        </h4>
      )}
      <tbody>
        {data?.map((course: any, index: number) => (
          <tr key={Number(course.id)}>
            <td
              style={{
                textAlign: "center",
              }}>
              {Number(course.id)}
            </td>
            <td
              style={{
                textAlign: "center",
              }}>
              {secondData?.length ? secondData.find((_course: any) => Number(_course.id) === Number(course.id))?.courseName : course.courseName}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SelectTable;
