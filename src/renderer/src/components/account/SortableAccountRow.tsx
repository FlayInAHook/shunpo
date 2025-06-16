import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Account } from "../../Datastorage";
import AccountRow from "./AccountRow";

interface SortableAccountRowProps {
  account: Account;
  index: number;
  id: string;
}

function SortableAccountRow({ account, index, id }: SortableAccountRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <AccountRow
        account={account}
        index={index}
        id={id}
        dragHandleProps={listeners}
      />
    </div>
  );
}

export default SortableAccountRow;
