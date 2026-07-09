import Body from "./Body";

export default function InstantLogin({params}) {
  return <Body username={params.username} listId={params.list_id}/>;
}
