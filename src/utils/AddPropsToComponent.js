import React from "react";

export function addPropsToComponent(body, props) {
  return React.cloneElement(body, props);
}