export default function VotingHelp() {
  return (
    <div className="flex flex-col gap-3 p-3">
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
      <ul className="list-inside list-disc">
        <li>sandwich S</li>
        <li>bread A</li>
        <li>soup B</li>
      </ul>
      <p>Notes:</p>
      <ul className="list-inside list-disc">
        <li>It IS case sensitive.</li>
        <li>
          You can overwrite your vote on an item by sending a new message with
          your new vote.
        </li>
      </ul>
    </div>
  );
}
