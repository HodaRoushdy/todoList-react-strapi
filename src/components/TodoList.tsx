
import { faker } from "@faker-js/faker";
import { ChangeEvent, FormEvent, useState } from "react";
import axiosInstance from "../config/axios.config";
import useAuthenticatedQuery from "../hooks/useAuthenticatedQuery";
import { ITodo } from "../interfaces";
import Button from "./ui/Button";
import Input from "./ui/Input";
import MyModal from "./ui/Modal";
import Paginator from "./ui/Paginator";
import Skeleton from "./ui/Skeleton";
import Textarea from "./ui/Textarea";

const TodoList = () => {
  // user information key which stored in local storage
  const userDataKey = "loggedInUserData";
  const userDataString = localStorage.getItem(userDataKey);
  const userData = userDataString ? JSON.parse(userDataString) : null;
  // state to control open and close edit todo modal
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  // state to control open and close Add todo modal
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  // state to control open and close delete todo modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  // to re-fetch data when apply any update on it
  const [queryVersion, setQueryVersion] = useState<number>(1);
  // equal to isLoading when apply edit on todo
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  // holds current page number
  const [page, setpage] = useState<number>(1);
  // holds page size number
  const [pageSize, setpageSize] = useState<number>(10);
  // holds the type of sorting
  const [sortBy, setSortBy] = useState<string>("DESC");
  // empty state to be filled with new updated todo
  const [todoToEdit, setTodoToEdit] = useState({
    id: 0,
    attributes: {
      title: "",
      description: "",
    },
  });
  // move you to previous page
  const onClickPrev = () => {
    setpage((prev) => prev - 1);
  };
  // move you to next page
  const onClickNext = () => {
    setpage((prev) => prev + 1);
  };
  // generate fake todos to apply pagination
  const generateFakeTodos = async () => {
    for (let i = 0; i < 100; i++) {
      try {
        const { data } = await axiosInstance.post(
          "http://localhost:1337/api/todos",
          {
            data: {
              title: faker.word.words(3),
              description: faker.lorem.paragraph(2),
              user: [userData.user.id],
            },
          },
          {
            headers: {
              Authorization: `Bearer ${userData.jwt}`,
            },
          }
        );
        console.log(data);
      } catch (error) {
        console.log(error);
      }
    }
  };
  // empty state to hold new todo
  const [todoToAdd, setTodoToAdd] = useState({
    attributes: {
      title: "",
      description: "",
    },
  });
  // change page size depend on user choice
  const onChangePageSize = (e: ChangeEvent<HTMLSelectElement>) => {
    setpageSize(+e.target.value);
  };
  // change type of sorting depend on user choice
  const onChangeSortBy = (e: ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };
  // save entered values from user in empty state
  const onChangeAdd = (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTodoToAdd({
      attributes: { ...todoToAdd.attributes, [name]: value },
    });
  };
  // save new todo in database
  const onSubmitAdd = async () => {
    try {
      const { status } = await axiosInstance.post(
        "http://localhost:1337/api/todos",
        {
          data: {
            ...todoToAdd.attributes,
            user: [userData.user.id],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${userData.jwt}`,
          },
        }
      );
      if (status === 200) {
        setQueryVersion((prev) => prev + 1);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsAddOpen(false);
    }
  };
  // close add modal
  const onCloseAdd = () => {
    setTodoToAdd({
      attributes: {
        title: "",
        description: "",
      },
    });
    setIsAddOpen(false);
  };

  // close edit modal
  const onCloseEdit = () => {
    setTodoToEdit({
      id: 0,
      attributes: {
        title: "",
        description: "",
      },
    });
    setIsEditOpen(false);
  };
  // close confirmation for delete modal
  const onCloseConfirm = () => {
    setTodoToEdit({
      id: 0,
      attributes: {
        title: "",
        description: "",
      },
    });
    setIsConfirmModalOpen(false);
  };
  // extract todo details when begins edit it
  const onOpenEdit = (todo: ITodo) => {
    setTodoToEdit(todo);
    setIsEditOpen(true);
  };
  // extract todo details when begins remove it
  const onOpenRemove = (todo: ITodo) => {
    setTodoToEdit(todo);
    setIsConfirmModalOpen(true);
  };
  // save entered values from user in empty state
  const onChangeHandler = (
    evt: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = evt.target;
    setTodoToEdit({
      id: todoToEdit.id,
      attributes: { ...todoToEdit.attributes, [name]: value },
    });
  };

  // save updated todo in database
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const { title, description } = todoToEdit.attributes;
      const { status } = await axiosInstance.put(
        `http://localhost:1337/api/todos/${todoToEdit.id}`,
        {
          data: { title, description },
        },
        {
          headers: {
            Authorization: `Bearer ${userData.jwt}`,
          },
        }
      );
      if (status === 200) {
        onCloseEdit();
        setQueryVersion((prev) => prev + 1);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsUpdating(false);
    }
  };
  // remove selected todo from database
  const handleRemove = async () => {
    try {
      const { status } = await axiosInstance.delete(
        `http://localhost:1337/api/todos/${todoToEdit.id}`,
        {
          headers: {
            Authorization: `Bearer ${userData.jwt}`,
          },
        }
      );
      if (status === 200) {
        onCloseConfirm();
        setQueryVersion((prev) => prev + 1);
      }
    } catch (error) {
      console.log(error);
    }
  };
// fetching data from database using custom hook 
  const { isLoading, error, data, isFetching } = useAuthenticatedQuery({
    url: `http://localhost:1337/api/todos?pagination[pageSize]=${pageSize}&pagination[page]=${page}&sort=createdAt:${sortBy}`,
    // re-fetch data when edit in values of any of these
    queryKey: [
      "todos",
      `${queryVersion}`,
      `${page}`,
      `${pageSize}`,
      `${sortBy}`,
    ],
    config: {
      headers: {
        Authorization: `Bearer ${userData.jwt}`,
      },
    },
  });
  // open add modal when click on add button
  const handleOpenAdd = () => {
    setIsAddOpen(true);
  };

  if (isLoading)
    return (
      // loading view
      <div className="flex flex-col gap-[1.5vw]">
        {Array.from({ length: 3 }, (_, idx) => (
          <Skeleton key={idx} />
        ))}
      </div>
    );
  if (error) return <h3>error</h3>;

  return (
    <div className="flex flex-col gap-[0.5vw] ">
      <div className="flex gap-[0.5vw] justify-between">
        <div className="flex gap-[0.5vw]">
          <select
            value={pageSize}
            onChange={onChangePageSize}
            className="border-2 border-indigo-600 rounded-md p-2">
            <option disabled>page size</option>
            <option value={10}>10</option>
            <option value={30}>30</option>
            <option value={40}>40</option>
            <option value={50}>50</option>
          </select>
          <select
            onChange={onChangeSortBy}
            value={sortBy}
            className="border-2 border-indigo-600 rounded-md p-2">
            <option disabled>sort by</option>
            <option value="ASC">Oldest</option>
            <option value="DESC">Latest</option>
          </select>
        </div>
        <div className="flex gap-[0.5vw]">
          <Button onClick={handleOpenAdd}>Add Todo</Button>
          <Button variant={"outline"} onClick={generateFakeTodos}>
            Generate Todos
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-[1vw]">
        {data.data.map((todo: ITodo) => (
          <div
            className="flex items-center justify-between hover:bg-gray-100 duration-300 p-3 rounded-md even:bg-gray-100"
            key={todo.id}>
            <p className="w-full font-semibold">
              {todo.id} - {todo.attributes.title}
            </p>
            <div className="flex items-center justify-end w-full space-x-3">
              <Button
                type="button"
                size={"sm"}
                onClick={() => {
                  onOpenEdit(todo);
                }}>
                Edit
              </Button>
              <Button
                type="button"
                variant={"danger"}
                size={"sm"}
                onClick={() => {
                  onOpenRemove(todo);
                }}>
                Remove
              </Button>
            </div>
          </div>
        ))}
        <Paginator
          total={data.meta.pagination.total}
          onClickNext={onClickNext}
          onClickPrev={onClickPrev}
          page={page}
          pageCount={data.meta.pagination.pageCount}
          isLoading={isLoading || isFetching}
        />
      </div>
      <MyModal closeModal={onCloseEdit} isOpen={isEditOpen} title="Edit">
        <form className="space-y-3" action="" onSubmit={handleSubmit}>
          <Input
            name="title"
            value={todoToEdit.attributes.title}
            onChange={onChangeHandler}
          />
          <Textarea
            name="description"
            value={todoToEdit.attributes.description}
            onChange={onChangeHandler}
          />
          <div className="flex justify-end gap-[0.5vw]">
            <Button variant={"default"} size={"sm"} isLoading={isUpdating}>
              Update
            </Button>
            <Button
              type="button"
              variant={"cancel"}
              size={"sm"}
              onClick={onCloseEdit}>
              Cancel
            </Button>
          </div>
        </form>
      </MyModal>
      <MyModal
        closeModal={onCloseConfirm}
        isOpen={isConfirmModalOpen}
        title="Are you sure you want to remove this todo from your store? "
        description="deleting this todo will remove it permanently from your inventory. any associated data , sales history and other related information will also be deleted. please make sure this is intended action ">
        <div className="flex items-center space-x-3">
          <Button variant={"danger"} onClick={handleRemove}>
            Yes, remove
          </Button>
          <Button type="button" variant={"cancel"} onClick={onCloseConfirm}>
            Cancel
          </Button>
        </div>
      </MyModal>
      <MyModal closeModal={onCloseAdd} isOpen={isAddOpen} title="Add New Todo">
        <Input name="title" onChange={onChangeAdd} />
        <Textarea name="description" onChange={onChangeAdd} />
        <div className="flex items-center space-x-3">
          <Button variant={"default"} onClick={onSubmitAdd}>
            Add
          </Button>
          <Button type="button" variant={"cancel"} onClick={onCloseAdd}>
            Cancel
          </Button>
        </div>
      </MyModal>
    </div>
  );
};

export default TodoList;
