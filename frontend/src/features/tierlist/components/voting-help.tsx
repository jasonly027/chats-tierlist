export default function VotingHelp() {
  return (
    <div className="top-0 flex flex-col gap-3 p-4">
      <h1 className="text-center text-lg font-bold">
        How to Vote as a Chatter
      </h1>
      <p>Enter the following in chat:</p>
      <p className="flex flex-wrap justify-center gap-2">
        <span className="rounded-sm border-1 border-gray-600 p-px font-bold text-blue-300">
          {'{itemName}'}
        </span>
        <span className="rounded-sm border-1 border-gray-600 p-px font-bold text-red-300">
          {'{tierName}'}
        </span>
      </p>
      <p>Examples:</p>
      <ul className="list-inside list-disc text-sm">
        <li>Apple Pie S</li>
        <li>Sandwich A</li>
        <li>Soup B</li>
      </ul>
      <p>Notes:</p>
      <ul className="list-inside list-disc text-sm">
        <li>Tier and item names are case sensitive.</li>
        <li>
          You can overwrite your vote on an item by sending a new message with
          your new vote.
        </li>
        <li>
          If an item is <em>focused</em>, only that item can be voted on.
        </li>
      </ul>
    </div>
  );
}
