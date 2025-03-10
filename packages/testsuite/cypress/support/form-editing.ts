Cypress.Commands.add("editForm", (formId) => {
  const editButton = "#" + formId + ' a.clickable[data-operation="edit"';
  cy.get(`#${formId}-editing`).should("not.be.visible");
  cy.get(editButton).click();
  cy.get(`#${formId}-editing`).should("be.visible");
});

Cypress.Commands.add("saveForm", (formId) => {
  const saveButton = "#" + formId + '-editing button.btn.btn-hal.btn-primary:contains("Save")';
  cy.get(saveButton).scrollIntoView().click();
});

Cypress.Commands.add("resetForm", (formId, managementApi, address) => {
  const resetButton = "#" + formId + ' a.clickable[data-operation="reset"';
  cy.get(resetButton).click();
  cy.get("body").then(($body) => {
    if ($body.find(".modal-footer .btn-hal.btn-primary").length) {
      cy.get(".modal-footer .btn-hal.btn-primary").click({ force: true });
      cy.verifySuccess();
    } else {
      cy.get(".toast-notifications-list-pf .alert-warning")
        .contains("None of the attributes could be reset.")
        .should("be.visible");
    }
  });
  cy.task("execute:cli", {
    managementApi: `${managementApi}/management`,
    operation: "read-resource-description",
    address: address,
  }).then((result) => {
    expect((result as { outcome: string }).outcome).to.equal("success");
    const attributes = (
      result as {
        result: { attributes: { [key: string]: { default?: string } } };
      }
    ).result.attributes;
    const attributesWithDefaultValues = Object.keys(attributes)
      .filter((key: string) => Object.prototype.hasOwnProperty.call(attributes[key], "default"))
      .map((key) => {
        const obj: {
          [index: string]: undefined | string | number | boolean;
        } = {};
        obj["name"] = key;
        obj["defaultValue"] = attributes[key].default;
        return obj;
      });
    attributesWithDefaultValues.forEach((attributeWithDefaultValue) => {
      cy.task("execute:cli", {
        managementApi: `${managementApi}/management`,
        operation: "read-attribute",
        address: address,
        name: attributeWithDefaultValue.name,
      }).then((result) => {
        expect((result as { outcome: string }).outcome).to.equal("success");
        expect((result as { result: string | number | boolean }).result).to.equal(
          attributeWithDefaultValue.defaultValue
        );
      });
    });
  });
});

Cypress.Commands.add("addInTable", (tableId) => {
  const tableWrapper = `#${tableId}_wrapper`;
  cy.get(`${tableWrapper} button.btn.btn-default > span:contains("Add")`).click();
});

Cypress.Commands.add("removeFromTable", (tableId, resourceName) => {
  const tableWrapper = `#${tableId}_wrapper`;
  cy.selectInTable(tableId, resourceName);
  cy.get(`${tableWrapper} button.btn.btn-default > span:contains("Remove")`).click();
  cy.get('div.modal-footer > button.btn.btn-hal.btn-primary:contains("Yes")').click();
});

Cypress.Commands.add("addSingletonResource", (addSingletonResourceId) => {
  cy.get("#" + addSingletonResourceId + ' .btn-primary:contains("Add")').click();
});

Cypress.Commands.add("removeSingletonResource", (formId) => {
  const removeButton = "#" + formId + ' a.clickable[data-operation="remove"';
  cy.get(removeButton).click();
  cy.get('div.modal-footer > button.btn.btn-hal.btn-primary:contains("Yes")').click();
});

/* eslint @typescript-eslint/unbound-method: off */
Cypress.Commands.add("flip", (formId, attributeName, value) => {
  cy.formInput(formId, attributeName)
    .wait(1000)
    .should(($input) => {
      if (value) {
        expect($input).to.be.checked;
      } else {
        expect($input).to.not.be.checked;
      }
    });
  cy.get('div[data-form-item-group="' + formId + "-" + attributeName + '-editing"] .bootstrap-switch-label:visible')
    .click()
    .wait(1000);
  cy.formInput(formId, attributeName).should(($input) => {
    if (value) {
      expect($input).to.not.be.checked;
    } else {
      expect($input).to.be.checked;
    }
  });
});

Cypress.Commands.add("text", (formId, attributeName, value) => {
  cy.formInput(formId, attributeName).click({ force: true }).wait(200).clear();
  cy.formInput(formId, attributeName).type(value as string);
  cy.formInput(formId, attributeName).should("have.value", value);
  cy.formInput(formId, attributeName).trigger("change");
});

Cypress.Commands.add("clearAttribute", (formId, attributeName) => {
  cy.formInput(formId, attributeName).click({ force: true }).wait(200).clear();
  cy.formInput(formId, attributeName).should("have.value", "");
  cy.formInput(formId, attributeName).trigger("change");
});

Cypress.Commands.add("clearListAttributeItems", (attributeName) => {
  cy.get(attributeName)
    .get("div.tag-manager-container")
    .children("span")
    .each((span) => {
      cy.wrap(span).find("a[href]").click({ multiple: true });
    });
});

export {};
/* eslint @typescript-eslint/no-namespace: off */
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Click on "Edit" and enable form for editing.
       * @category Form Editing
       *
       * @param formId - The ID of section which need to be edit.
       */
      editForm(formId: string): Chainable<void>;
      /**
       * Click on "Save" button to save current data in form.
       * @category Form Editing
       *
       * @param formId - The ID of section which need to be save.
       */
      saveForm(formId: string): Chainable<void>;
      /**
       * Click on "Reset" button to reset saved values to default. And verify saved values.
       * @category Form Editing
       *
       * @param formId - The ID of section which need to be reset.
       * @param managementApi - Host name of currently used container.
       * @param address - Indexes contains values between "/" from request address.
       */
      resetForm(formId: string, managementApi: string, address: string[]): Chainable<void>;
      /**
       * Click on "add" to create a new resource in a table.
       * @category Resource management
       *
       * @param tableId - The ID of table where need to be added a new resource.
       */
      addInTable(tableId: string): void;
      /**
       * Select resource from table and click on "Remove" to delete the resource.
       * @category Resource management
       *
       * @param tableId - The ID of table where need to be added a new resource.
       * @param resourceName - The name of a resource from table.
       */
      removeFromTable(tableId: string, resourceName: string): void;
      /**
       * Click on "add" to create a new singleton resource.
       * @category Resource management
       *
       * @param addSingletonResourceId - The ID of div with \<h1> "No resource found" and another div with button "Add".
       */
      addSingletonResource(addSingletonResourceId: string): void;
      /**
       * Click on "remove" to delete a singleton resource.
       * @category Resource management
       *
       * @param formId - The ID of section which contain "Remove" for delete a singleton resource.
       */
      removeSingletonResource(formId: string): void;
      /**
       * Toggle on/off switch.
       * @category Data inserting
       *
       * @param formId - The ID of section which contain form inputs.
       * @param attributeName - specific ID part of form input with on/off switch.
       * @param value - current value of on/off switch. Will be set the opposite value.
       */
      flip(formId: string, attributeName: string, value: boolean): Chainable<void>;
      /**
       * Set text value to form input.
       * @category Data inserting
       *
       * @param formId - The ID of section which contain form inputs.
       * @param attributeName - specific ID part of form input with text form input.
       * @param value - the value which needs to be write to form input.
       */
      text(formId: string, attributeName: string, value: string | number): Chainable<void>;
      /**
       * Clear all selected list attribute items from the form input.
       * @category Data removing
       *
       * @param attributeName - name of form input.
       */
      clearListAttributeItems(attributeName: string): Chainable<void>;
      /**
       * Remove text value from form input.
       * @category Data inserting
       *
       * @param formId - The ID of section which contain form inputs.
       * @param attributeName - specific ID part of form input with text form input.
       */
      clearAttribute(formId: string, attributeName: string): Chainable<void>;
    }
  }
}
