const DEFAULT_TIMEZONE =
  "Asia/Manila";

const DEFAULT_DATE_FORMAT =
  "MM/DD/YYYY";


export const getSystemTimezone = () => {
  return (
    localStorage.getItem(
      "system_timezone"
    ) ||
    DEFAULT_TIMEZONE
  );
};


export const getSystemDateFormat = () => {
  return (
    localStorage.getItem(
      "system_date_format"
    ) ||
    DEFAULT_DATE_FORMAT
  );
};


const getDateParts = (
  value
) => {
  if (!value) {
    return null;
  }


  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    const [
      year,
      month,
      day,
    ] = value.split("-");


    return {
      year,
      month,
      day,
    };
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }


  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          getSystemTimezone(),

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    );


  const parts =
    formatter.formatToParts(
      date
    );


  const result = {};


  parts.forEach(
    (part) => {
      if (
        part.type === "year" ||
        part.type === "month" ||
        part.type === "day"
      ) {
        result[
          part.type
        ] = part.value;
      }
    }
  );


  return result;
};


export const formatDate = (
  value,
  fallback = "—"
) => {
  const parts =
    getDateParts(value);


  if (!parts) {
    return fallback;
  }


  const {
    year,
    month,
    day,
  } = parts;


  switch (
    getSystemDateFormat()
  ) {
    case "DD/MM/YYYY":
      return (
        `${day}/${month}/${year}`
      );


    case "YYYY-MM-DD":
      return (
        `${year}-${month}-${day}`
      );


    case "MM/DD/YYYY":
    default:
      return (
        `${month}/${day}/${year}`
      );
  }
};


export const formatTime = (
  value,
  fallback = "—"
) => {
  if (!value) {
    return fallback;
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return fallback;
  }


  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        getSystemTimezone(),

      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        true,
    }
  ).format(date);
};


export const formatDateTime = (
  value,
  fallback = "—"
) => {
  const datePart =
    formatDate(
      value,
      fallback
    );


  if (
    datePart === fallback
  ) {
    return fallback;
  }


  const timePart =
    formatTime(
      value,
      fallback
    );


  if (
    timePart === fallback
  ) {
    return datePart;
  }


  return (
    `${datePart} ${timePart}`
  );
};