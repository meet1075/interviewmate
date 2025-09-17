import { WebhookEvent } from '@clerk/nextjs/server'
import connectDb from '@/dbconfig/db'
import User from '@/models/user.model'
import { NextResponse } from 'next/server'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const evt: WebhookEvent = await verifyWebhook(req);

    const { id } = evt.data;
    const eventType = evt.type;
    
    console.log(`Webhook with an ID of ${id} and type of ${eventType}`)
    
    await connectDb();

    // --- HANDLE USER CREATION ---
    if (eventType === 'user.created') {
      const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;

      // The test webhook from Clerk's dashboard might have an empty email_addresses array.
      // A real user signing up will always have at least one.
      if (!email_addresses || email_addresses.length === 0) {
          console.warn(`Webhook for user ${id} has no email addresses. This is common for test webhooks. Skipping DB creation.`);
          return new NextResponse('Webhook received, but no email address to process (common for tests).', { status: 200 });
      }

      const newUser = new User({
          clerkId: id,
          email: email_addresses[0].email_address,
          userName: username,
          profileImage: image_url,
          firstName: first_name,
          lastName: last_name,
      });

      try {
          await newUser.save();
          console.log('New user created in DB:', newUser);
          return new NextResponse('User created successfully', { status: 201 });
      } catch (dbError) {
          console.error('Error saving user to DB:', dbError);
          return new NextResponse('Error occurred while creating the user in the database', { status: 500 });
      }
    }
    
    // --- HANDLE USER UPDATES ---
    if (eventType === 'user.updated') {
        const { id, image_url, first_name, last_name, username } = evt.data;

        const updatedUser = await User.findOneAndUpdate(
            { clerkId: id },
            {
                userName: username,
                profileImage: image_url,
                firstName: first_name,
                lastName: last_name,
            },
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
             return new NextResponse('User not found for update.', { status: 404 });
        }

        console.log(`User ${id} updated in DB.`);
        return new NextResponse('User updated successfully', { status: 200 });
    }

    // --- HANDLE USER DELETION ---
    if (eventType === 'user.deleted') {
        const { id } = evt.data;
        
        // Use the 'id' from the event data, which corresponds to the clerkId in your schema
        const deletedUser = await User.findOneAndDelete({ clerkId: id });

        if (!deletedUser) {
            return new NextResponse('User not found for deletion.', { status: 404 });
        }

        console.log(`User ${id} deleted from DB.`);
        return new NextResponse('User deleted successfully', { status: 200 });
    }
    
    return new NextResponse('Webhook received', { status: 200 })

  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new NextResponse('Error verifying webhook', { status: 400 })
  }
}

