const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const addTemplateRecipients = async (req, res) => {
  try {
    const { template_id } = req.params;
    const { recipients } = req.body; 
    const { organisation_user_id } = req.user;

    const template = await prisma.checklist_template.findUnique({
      where: { id: parseInt(template_id) },
      include: {
        OrganisationUsers: true,
        ChecklistTemplateOwners: true,
      },
    });

    if (!template) {
      return res.status(400).json({ message: "Template not found" });
    }

    // const isOwner = template.ChecklistTemplateOwners.some(
    //   (owner) => owner.organisation_user_id === organisation_user_id
    // );

    // if (!isOwner) {
    //   return res
    //     .status(400)
    //     .json({ message: "Unauthorized to modify this template" });
    // }

    const createdRecipients = await prisma.templateRecipients.createMany({
      data: recipients.map((recipient) => ({
        checklist_template_id: parseInt(template_id),
        recipient_email: recipient.email,
        cc_bcc_emails: recipient.type,
        assigned_by_user_id: organisation_user_id,
        created_at: new Date(),
        updated_at: new Date(),
      })),
    });

    res.status(201).json({
      message: "Recipients added successfully",
      count: createdRecipients.count,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to add recipients", error: error.message });
  }
};

const removeTemplateRecipient = async (req, res) => {
  try {
    const { recipient_id } = req.params;
    const { organisation_user_id } = req.user;
    const recipient = await prisma.templateRecipients.findUnique({
      where: { id: parseInt(recipient_id) },
      include: {
        checklistTemplate: {
          include: {
            ChecklistTemplateOwners: true,
          },
        },
      },
    });

    if (!recipient) {
      return res.status(400).json({ message: "Recipient not found" });
    }

    // const isOwner = recipient.checklistTemplate.ChecklistTemplateOwners.some(
    //   (owner) => owner.organisation_user_id === organisation_user_id
    // );

    // if (!isOwner) {
    //   return res
    //     .status(400)
    //     .json({ message: "Unauthorized to modify this template" });
    // }

    await prisma.templateRecipients.delete({
      where: { id: parseInt(recipient_id) },
    });

    res.status(200).json({ message: "Recipient removed successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to remove recipient", error: error.message });
  }
};

const getTemplateRecipients = async (req, res) => {
  try {
    const { template_id } = req.params;
    const recipients = await prisma.templateRecipients.findMany({
      where: { checklist_template_id: parseInt(template_id) },
      include: {
        assignedByUser: true
      },
    });

    res.status(200).json(recipients);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch recipients", error: error.message });
  }
};

module.exports = {
  addTemplateRecipients,
  removeTemplateRecipient,
  getTemplateRecipients,
};
