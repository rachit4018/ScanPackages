import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import CRUDTable, {
  Fields,
  Field,
  CreateForm,
  UpdateForm,
  DeleteForm,
} from "react-crud-table";

import "../styles/list.css";

const serverUrl = "http://127.0.0.1:8000";

const DescriptionRenderer = ({ field }) => <textarea {...field} />;

const SORTERS = {
  NUMBER_ASCENDING: (mapper) => (a, b) => mapper(a) - mapper(b),
  NUMBER_DESCENDING: (mapper) => (a, b) => mapper(b) - mapper(a),
  STRING_ASCENDING: (mapper) => (a, b) => mapper(a).localeCompare(mapper(b)),
  STRING_DESCENDING: (mapper) => (a, b) => mapper(b).localeCompare(mapper(a)),
};

const getSorter = (data) => {
  const mapper = (x) => x[data.field];
  let sorter = SORTERS.STRING_ASCENDING(mapper);

  if (data.field === "id") {
    sorter =
      data.direction === "ascending"
        ? SORTERS.NUMBER_ASCENDING(mapper)
        : SORTERS.NUMBER_DESCENDING(mapper);
  } else {
    sorter =
      data.direction === "ascending"
        ? SORTERS.STRING_ASCENDING(mapper)
        : SORTERS.STRING_DESCENDING(mapper);
  }

  return sorter;
};

const service = {
  fetchItems: (payload) => {
    let user_id = 100;
    try {

        let promise = fetch(serverUrl + "/cards/"+ user_id, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }).then((response) => response.json()).catch(err => console.error);
    
        return Promise.resolve(promise ? promise : []);
    } catch (err) {
        console.error(err.message)
    }
  },
  create: (card) => {
    let promise = fetch(serverUrl + "/cards", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        card_id: card.card_id? card.card_id: "",
        user_id: 100,
        Telephone: card.Telephone ? [card.Telephone] : [""],
        Email: card.Email ? card.Email : [""],
        b_name: card.b_name ? card.b_name : "",
        Website: card.Website ? card.Website : "",
        Address: card.Address ? card.Address : "",
        user_id: card.user_id ? card.user_id : "",
        image_storage: card.image_url ? card.image_url : "",
      }),
    }).then((response) => response.json());

    return Promise.resolve(promise);
  },
  update: (data) => {

    let user_id = 100;
    data["user_id"] = user_id;
    let promise = fetch(serverUrl + "/cards", {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((response) => response.json());

    return Promise.resolve(promise);

    // const card = cards.find(t => t.id === data.id);
    // card.title = data.title;
    // card.description = data.description;
    // return Promise.resolve(card);
  },
  delete: (data) => {
    let user_id = 100;
    let promise = fetch(serverUrl + "/cards/" + user_id + "/" + data.card_id, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }).then((response) => response.json());

    return Promise.resolve(promise);
  },
};

const styles = {
  container: { margin: "auto", width: "fit-content" },
};

function List(props) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("user_sub")) {
      window.location = "/login";
    }
  });

  const handleSearchChange = (event) => {
    let searchTerm = event.target.value;
    setSearch(searchTerm);

    service.fetchItems();
  };

  return (
    <div>
      <div style={styles.container}>
        {/* <div className="input-container ic1" style={{ border: "2px solid grey"}}>
                <input id="search" className="input" value={search} onChange={(e)=>handleSearchChange(e)} type="text" placeholder="Search " />
            </div> */}
        <CRUDTable
          caption="Cards"
          fetchItems={(payload) => service.fetchItems(payload)}
        >
          <Fields>
            <Field name="card_id" label="Id" hideInCreateForm readOnly />
            <Field name="b_name" label="Name" />
            <Field name="Telephone" label="Phone" />
            <Field name="Email" label="Email" />
            <Field name="Website" label="Website" />
            <Field
              name="Address"
              label="address"
              render={DescriptionRenderer}
            />
          </Fields>
          {/* <CreateForm
                title="Card Creation"
                message="Create a new card!"
                trigger="Create Card"
                onSubmit={(card) => {service.create(card)}}
                submitText="Create"
              /> */}

          <UpdateForm
            title="Card Update Process"
            message="Update task"
            trigger="Update"
            onSubmit={(card) => service.update(card)}
            submitText="Update"
            // validate={(values) => {
            //   const errors = {};

            //   if (!values.id) {
            //     errors.id = 'Please, provide id';
            //   }

            //   if (!values.name) {
            //     errors.title = 'Please, provide task\'s title';
            //   }

            //   if (!values.email) {
            //     errors.description = 'Please, provide task\'s description';
            //   }

            //   return errors;
            // }}
          />

          <DeleteForm
            title="Card Delete Process"
            message="Are you sure you want to delete the task?"
            trigger="Delete"
            onSubmit={(card) => service.delete(card)}
            submitText="Delete"
            validate={(values) => {
              const errors = {};
              if (!values.id) {
                errors.id = "Please, provide id";
              }
              return errors;
            }}
          />
        </CRUDTable>
      </div>
    </div>
  );
}

export default List;
