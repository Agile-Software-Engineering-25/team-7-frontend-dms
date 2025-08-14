describe('Document Management - rename & delete flows', () => {
  beforeEach(() => {
    // stub folder GET
    cy.intercept('GET', '/dms/v1/folders/*', {
      statusCode: 200,
      body: {
        documents: [
          { id: '1', name: 'Project Plan.docx', size: 23456, createdDate: '2025-08-01T10:23:00Z', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
          { id: '2', name: 'Designs.pdf', size: 1048576, createdDate: '2025-07-28T08:12:00Z', type: 'application/pdf' }
        ],
        subfolders: [
          { id: '3', name: 'Archives', createdDate: '2025-06-15T12:00:00Z' }
        ]
      }
    }).as('getFolder');

    // stub patch (rename)
    cy.intercept('PATCH', '/dms/v1/documents/*', (req) => {
      req.reply((res) => {
        res.send({ statusCode: 200, body: { id: req.url.split('/').pop(), name: req.body.name } });
      });
    }).as('patchDoc');

    // stub delete
    cy.intercept('DELETE', '/dms/v1/documents/*', { statusCode: 204 }).as('deleteDoc');
  });

  it('renames a document and shows snackbar', () => {
    // try visiting the dedicated route, fallback to root
  // ensure app is loaded; adjust path if your app mounts the page differently
  cy.visit('/document-management');
  cy.wait('@getFolder');

    // find the row with the document
    cy.contains('Project Plan.docx').should('exist');

    // open actions
    cy.get('[aria-label="Open actions for Project Plan.docx"]').click();
    cy.contains('Rename').click();

    // dialog appears
    cy.get('input[label="New name"], input[aria-label="New name"]').clear().type('Project Plan v2.docx');
    cy.contains('Rename').click();

    cy.wait('@patchDoc');

    // snackbar appears with success
    cy.contains('Renamed').should('exist');
    cy.contains('Project Plan v2.docx').should('exist');
  });

  it('deletes a document after confirmation', () => {
  cy.visit('/document-management');
  cy.wait('@getFolder');

    cy.contains('Designs.pdf').should('exist');

    cy.get('[aria-label="Open actions for Designs.pdf"]').click();
    cy.contains('Delete').click();

    // confirm dialog
    cy.contains('Delete').click(); // dialog confirm

    cy.wait('@deleteDoc');

    // success snackbar
    cy.contains('Deleted').should('exist');
    cy.contains('Designs.pdf').should('not.exist');
  });

  it('has accessible controls and roles', () => {
    cy.visit('/document-management');
    cy.wait('@getFolder');

    // action button should have accessible label
    cy.get('[aria-label="Open actions for Project Plan.docx"]').should('have.attr', 'aria-haspopup');

    // open menu and assert role
    cy.get('[aria-label="Open actions for Project Plan.docx"]').click();
    cy.get('[role="menu"]').should('exist');

    // open rename dialog via keyboard (press Enter on first menu item)
    cy.get('[role="menu"] button').first().focus().type('{enter}');
    cy.get('#rename-title').should('exist');
    // dialog input should be focused (input or textarea)
    cy.focused().then(($el) => {
      const tag = $el.prop('tagName').toLowerCase();
      expect(['input', 'textarea']).to.include(tag);
    });
  });
});
